-- Create FRIEND table
CREATE TABLE IF NOT EXISTS public."FRIEND" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);

-- Ensure ordering: user_a < user_b to avoid duplicates
CREATE OR REPLACE FUNCTION public.normalize_friend_pair(u1 uuid, u2 uuid)
RETURNS TABLE(a uuid, b uuid) LANGUAGE sql AS $$
  SELECT CASE WHEN u1 < u2 THEN u1 ELSE u2 END, CASE WHEN u1 < u2 THEN u2 ELSE u1 END;
$$;

-- Trigger function to create FRIEND when FRIEND_REQUEST.status becomes 'accepted'
CREATE OR REPLACE FUNCTION public.friend_request_to_friend()
RETURNS TRIGGER AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted') OR (TG_OP = 'INSERT' AND NEW.status = 'accepted') THEN
    -- normalize
    SELECT a, b INTO a, b FROM public.normalize_friend_pair(NEW.sender_id, NEW.receiver_id);
    -- insert if not exists
    INSERT INTO public."FRIEND" (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_friend_request_to_friend ON public."FRIEND_REQUEST";
CREATE TRIGGER trg_friend_request_to_friend
AFTER INSERT OR UPDATE ON public."FRIEND_REQUEST"
FOR EACH ROW
EXECUTE FUNCTION public.friend_request_to_friend();

-- Create a view for mutual friends for a given user: lists friend_id and since
CREATE OR REPLACE VIEW public.mutual_friends AS
SELECT f.user_a AS user_id, f.user_b AS friend_id, f.created_at
FROM public."FRIEND" f
UNION ALL
SELECT f.user_b AS user_id, f.user_a AS friend_id, f.created_at
FROM public."FRIEND" f;

-- Enable RLS on view is not supported, so create a security barrier view and a table-like policy via a policy on FRIEND
-- Enable RLS on FRIEND table
ALTER TABLE public."FRIEND" ENABLE ROW LEVEL SECURITY;

-- Policy: allow users to SELECT rows where they are user_a or user_b
CREATE POLICY "friends_can_see_their_rows" ON public."FRIEND"
FOR SELECT TO authenticated
USING (user_a = (SELECT auth.uid()) OR user_b = (SELECT auth.uid()));

-- To allow the view mutual_friends to be queried by authenticated users only for their rows,
-- create a security definer function that returns the rows for the current user
CREATE OR REPLACE FUNCTION public.get_my_mutual_friends()
RETURNS TABLE(friend_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE WHEN user_a = auth.uid() THEN user_b ELSE user_a END AS friend_id, created_at
  FROM public."FRIEND"
  WHERE user_a = auth.uid() OR user_b = auth.uid();
$$;

-- Revoke execute from public roles
REVOKE EXECUTE ON FUNCTION public.get_my_mutual_friends() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_mutual_friends() TO authenticated;

-- Create a view that calls the function for convenience
CREATE OR REPLACE VIEW public.my_mutual_friends AS
SELECT * FROM public.get_my_mutual_friends();

-- Tests: nothing inserted. Return count of friends
SELECT count(*) AS friend_rows FROM public."FRIEND";

-- 1) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_user_a ON public."FRIEND" (user_a);
CREATE INDEX IF NOT EXISTS idx_friend_user_b ON public."FRIEND" (user_b);

-- 2) Update trigger function to also delete FRIEND when FRIEND_REQUEST becomes not 'accepted'
CREATE OR REPLACE FUNCTION public.friend_request_to_friend()
RETURNS TRIGGER AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  -- On insert or update to accepted -> ensure friend exists
  IF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted') OR (TG_OP = 'INSERT' AND NEW.status = 'accepted') THEN
    SELECT a, b INTO a, b FROM public.normalize_friend_pair(NEW.sender_id, NEW.receiver_id);
    INSERT INTO public."FRIEND" (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;

  -- On update where status changed from accepted to something else -> remove friend
  IF (TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status IS DISTINCT FROM 'accepted') THEN
    SELECT a, b INTO a, b FROM public.normalize_friend_pair(NEW.sender_id, NEW.receiver_id);
    DELETE FROM public."FRIEND" WHERE user_a = a AND user_b = b;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger already exists; re-create trigger to ensure it uses updated function
DROP TRIGGER IF EXISTS trg_friend_request_to_friend ON public."FRIEND_REQUEST";
CREATE TRIGGER trg_friend_request_to_friend
AFTER INSERT OR UPDATE OR DELETE ON public."FRIEND_REQUEST"
FOR EACH ROW
EXECUTE FUNCTION public.friend_request_to_friend();

-- 4) Handle deletes: create a small wrapper trigger function to handle DELETE (since previous function expects NEW)
CREATE OR REPLACE FUNCTION public.friend_request_delete_handler()
RETURNS TRIGGER AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    SELECT a, b INTO a, b FROM public.normalize_friend_pair(OLD.sender_id, OLD.receiver_id);
    DELETE FROM public."FRIEND" WHERE user_a = a AND user_b = b;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_friend_request_delete ON public."FRIEND_REQUEST";
CREATE TRIGGER trg_friend_request_delete
AFTER DELETE ON public."FRIEND_REQUEST"
FOR EACH ROW
EXECUTE FUNCTION public.friend_request_delete_handler();

-- 5) Create mutual friends between two users view (common friends)
CREATE OR REPLACE VIEW public.common_friends AS
SELECT
  u1::uuid AS user_id,
  u2::uuid AS other_user_id,
  f.friend_id::uuid AS mutual_friend_id
FROM (
  SELECT user_a AS a, user_b AS b FROM public."FRIEND"
) fbase
-- expand to rows (both directions) for easy joins
CROSS JOIN LATERAL (
  VALUES (fbase.a, fbase.b), (fbase.b, fbase.a)
) AS pairs(u1, u2)
JOIN LATERAL (
  SELECT CASE WHEN pairs.u1 = f.user_a THEN f.user_b ELSE f.user_a END AS friend_id
  FROM public."FRIEND" f
  WHERE f.user_a = pairs.u1 OR f.user_b = pairs.u1
) f ON TRUE
-- ensure mutual friend is also a friend of u2
WHERE EXISTS (
  SELECT 1 FROM public."FRIEND" f2
  WHERE (f2.user_a = LEAST(pairs.u2, f.friend_id) AND f2.user_b = GREATEST(pairs.u2, f.friend_id))
)
ORDER BY user_id, other_user_id;

-- Note: common_friends returns rows (user_id, other_user_id, mutual_friend_id) meaning mutual_friend_id is a friend common to user_id and other_user_id.

-- 6) Quick validations
SELECT count(*) AS friend_count FROM public."FRIEND";
SELECT count(*) AS users_count FROM public.users;

-- 1) Add INSERT/DELETE policies: allow WRITE only via service_role and via triggers (owners)
-- Revoke any broad policies first (be careful)
-- Policy: prevent direct INSERT/DELETE by authenticated; allow only service_role
DROP POLICY IF EXISTS "friends_can_see_their_rows" ON public."FRIEND";

-- Recreate SELECT policy
CREATE POLICY "friends_can_see_their_rows" ON public."FRIEND"
FOR SELECT TO authenticated
USING (user_a = (SELECT auth.uid()) OR user_b = (SELECT auth.uid()));

-- Deny INSERT/DELETE to authenticated by not creating policies for them.
-- Create policy to allow INSERT/DELETE only to role "service_role" (note: service_role bypasses RLS but policy explicit for clarity)
CREATE POLICY "friends_service_write" ON public."FRIEND"
FOR ALL TO "service_role"
USING (true)
WITH CHECK (true);

-- 2) Replace common_friends view with optimized, deduplicated version
-- Approach: For two users A and B, mutual friends are users who appear as friend with both A and B.
-- We'll create a view that lists (user_id, other_user_id, mutual_friend_id) with user_id < other_user_id to avoid duplicates.

CREATE OR REPLACE VIEW public.common_friends AS
WITH expanded AS (
  SELECT LEAST(user_a, user_b) AS u1, GREATEST(user_a, user_b) AS u2
  FROM public."FRIEND"
),
friends AS (
  -- list each user -> friend mapping
  SELECT user_a AS user_id, user_b AS friend_id FROM public."FRIEND"
  UNION
  SELECT user_b AS user_id, user_a AS friend_id FROM public."FRIEND"
),
pairs AS (
  SELECT DISTINCT f1.user_id AS user_id, f2.user_id AS other_user_id, f1.friend_id AS mutual_friend_id
  FROM friends f1
  JOIN friends f2 ON f1.friend_id = f2.friend_id
  WHERE f1.user_id < f2.user_id
)
SELECT user_id, other_user_id, mutual_friend_id
FROM pairs
ORDER BY user_id, other_user_id, mutual_friend_id;

-- Add index to speed up friends mapping queries
CREATE INDEX IF NOT EXISTS idx_friend_user_map ON public."FRIEND" (user_a, user_b);

-- Validation: show zero or more rows
SELECT count(*) AS common_friends_rows FROM public.common_friends;


CREATE TRIGGER friend_request_after_delete
  AFTER DELETE ON public."FRIEND_REQUEST"
  FOR EACH ROW
  EXECUTE FUNCTION public.friend_request_delete_handler();
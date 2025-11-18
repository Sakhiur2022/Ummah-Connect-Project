-- Create counter tables referencing existing quoted tables
CREATE TABLE IF NOT EXISTS public."POST_COUNTER" (
  post_id BIGINT PRIMARY KEY REFERENCES public."POST"(post_id) ON DELETE CASCADE,
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."POST_REACTION_COUNT" (
  post_id BIGINT REFERENCES public."POST"(post_id) ON DELETE CASCADE,
  reaction_type_id SMALLINT REFERENCES public."REACTION_TYPE"(reaction_type_id) ON DELETE RESTRICT,
  reaction_count INTEGER DEFAULT 0 CHECK (reaction_count >= 0),
  PRIMARY KEY (post_id, reaction_type_id)
);

-- Reaction increment/decrement
CREATE OR REPLACE FUNCTION public.bcnf_increment_reaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."POST_COUNTER" (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  INSERT INTO public."POST_REACTION_COUNT" (post_id, reaction_type_id)
  VALUES (NEW.post_id, NEW.reaction_type_id)
  ON CONFLICT (post_id, reaction_type_id) DO NOTHING;

  UPDATE public."POST_COUNTER"
  SET total_reactions = total_reactions + 1
  WHERE post_id = NEW.post_id;

  UPDATE public."POST_REACTION_COUNT"
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id
  AND reaction_type_id = NEW.reaction_type_id;

  -- Create notification for post owner (but not if it's their own post)
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, object_id_bigint, created_at)
  SELECT p.creator_id, NEW.user_id, 'react', 'post', NEW.post_id, now()
  FROM public."POST" p
  WHERE p.post_id = NEW.post_id
  AND p.creator_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_react_insert ON public."REACT";
CREATE TRIGGER trg_bcnf_react_insert
AFTER INSERT ON public."REACT"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_reaction();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_reaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public."POST_COUNTER"
  SET total_reactions = GREATEST(total_reactions - 1, 0)
  WHERE post_id = OLD.post_id;

  UPDATE public."POST_REACTION_COUNT"
  SET reaction_count = GREATEST(reaction_count - 1, 0)
  WHERE post_id = OLD.post_id
  AND reaction_type_id = OLD.reaction_type_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_react_delete ON public."REACT";
CREATE TRIGGER trg_bcnf_react_delete
AFTER DELETE ON public."REACT"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_reaction();

-- Comment increment/decrement
CREATE OR REPLACE FUNCTION public.bcnf_increment_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."POST_COUNTER" (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  UPDATE public."POST_COUNTER"
  SET total_comments = total_comments + 1
  WHERE post_id = NEW.post_id;

  -- notify post owner
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, object_id_bigint, created_at)
  SELECT p.creator_id, NEW.user_id, 'comment', 'post', NEW.post_id, now()
  FROM public."POST" p
  WHERE p.post_id = NEW.post_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_comment_insert ON public."COMMENTS";
CREATE TRIGGER trg_bcnf_comment_insert
AFTER INSERT ON public."COMMENTS"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_comment();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public."POST_COUNTER"
  SET total_comments = GREATEST(total_comments - 1, 0)
  WHERE post_id = OLD.post_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_comment_delete ON public."COMMENTS";
CREATE TRIGGER trg_bcnf_comment_delete
AFTER DELETE ON public."COMMENTS"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_comment();

-- Share increment/decrement
CREATE OR REPLACE FUNCTION public.bcnf_increment_share()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."POST_COUNTER" (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  UPDATE public."POST_COUNTER"
  SET total_shares = total_shares + 1
  WHERE post_id = NEW.post_id;

  -- notify post owner
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, object_id_bigint, created_at)
  SELECT p.creator_id, NEW.user_id, 'share', 'post', NEW.post_id, now()
  FROM public."POST" p
  WHERE p.post_id = NEW.post_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_share_insert ON public."Share";
CREATE TRIGGER trg_bcnf_share_insert
AFTER INSERT ON public."Share"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_share();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_share()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public."POST_COUNTER"
  SET total_shares = GREATEST(total_shares - 1, 0)
  WHERE post_id = OLD.post_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_share_delete ON public."Share";
CREATE TRIGGER trg_bcnf_share_delete
AFTER DELETE ON public."Share"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_share();

-- Post insert: notify followers / create notification
CREATE OR REPLACE FUNCTION public.bcnf_post_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Optionally create a notification row for followers or timeline; here we notify the creator (no-op) or system
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, object_id_bigint, created_at)
  VALUES (NEW.creator_id, NEW.creator_id, 'post_created', 'post', NEW.post_id, now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_post_insert ON public."POST";
CREATE TRIGGER trg_bcnf_post_insert
AFTER INSERT ON public."POST"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_post_insert();

-- Reply insert: notify comment owner
CREATE OR REPLACE FUNCTION public.bcnf_reply_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- find comment owner and notify
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, object_id, created_at)
  SELECT c.user_id, NEW.user_id, 'reply', 'comment', c.id, now()
  FROM public."COMMENTS" c
  WHERE c.id = NEW.comment_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_reply_insert ON public."REPLY";
CREATE TRIGGER trg_bcnf_reply_insert
AFTER INSERT ON public."REPLY"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_reply_insert();

-- Friend request: notify receiver
CREATE OR REPLACE FUNCTION public.bcnf_friend_request_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."NOTIFICATION" (recipient_id, actor_id, verb, object_type, created_at)
  VALUES (NEW.receiver_id, NEW.sender_id, 'friend_request', 'user', now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_friend_request_insert ON public."FRIEND_REQUEST";
CREATE TRIGGER trg_bcnf_friend_request_insert
AFTER INSERT ON public."FRIEND_REQUEST"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_friend_request_insert();



-- Create notification count functions
CREATE OR REPLACE FUNCTION public.notification_count(recipient_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(COUNT(1),0)
  FROM public."NOTIFICATION"
  WHERE recipient_id = $1
    AND (is_read IS DISTINCT FROM true OR is_read IS NULL)
    AND (is_dismissed IS DISTINCT FROM true OR is_dismissed IS NULL);
$$;

CREATE OR REPLACE FUNCTION public.notification_count_by_type(recipient_id uuid)
RETURNS TABLE(verb text, cnt bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT verb, COUNT(1)
  FROM public."NOTIFICATION"
  WHERE recipient_id = $1
    AND (is_read IS DISTINCT FROM true OR is_read IS NULL)
    AND (is_dismissed IS DISTINCT FROM true OR is_dismissed IS NULL)
  GROUP BY verb
  ORDER BY COUNT(1) DESC;
$$;

-- small validation select
SELECT public.notification_count((SELECT id FROM public.users LIMIT 1)) AS sample_count;


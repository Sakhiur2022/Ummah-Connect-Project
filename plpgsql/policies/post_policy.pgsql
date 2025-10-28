ALTER TABLE public."POST" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POST" FORCE ROW LEVEL SECURITY;

CREATE POLICY "super_admin full access"
ON public."POST"
FOR ALL
USING (
  auth.uid() IN (
    SELECT ur.user_id
    FROM public."USER_ROLE" ur
    JOIN public."ROLE" r ON ur.role_id = r.role_id
    WHERE r.role_name = 'super_admin'
  )
)
WITH CHECK (true);

CREATE POLICY "admin and moderator can manage flagged posts"
ON public."POST"
FOR SELECT USING (
  is_flagged = TRUE
  AND auth.uid() IN (
    SELECT ur.user_id
    FROM public."USER_ROLE" ur
    JOIN public."ROLE" r ON ur.role_id = r.role_id
    WHERE r.role_name IN ('admin', 'moderator')
  )
);

CREATE POLICY "admin and moderator can update flagged posts"
ON public."POST"
FOR UPDATE USING (
  is_flagged = TRUE
  AND auth.uid() IN (
    SELECT ur.user_id
    FROM public."USER_ROLE" ur
    JOIN public."ROLE" r ON ur.role_id = r.role_id
    WHERE r.role_name IN ('admin', 'moderator')
  )
);



CREATE POLICY "users can view visible posts"
ON public."POST"
FOR SELECT
USING (
  status = 'active'
  AND (
    visibility = 'public'
    OR creator_id = auth.uid()
    OR (visibility = 'friends' AND auth.uid() IN (
        SELECT receiver_id FROM "FRIEND_REQUEST" WHERE sender_id = creator_id AND status = 'accepted'
      ))
    -- OR (visibility = 'mahram' AND auth.uid() IN (
    --     SELECT related_user_id FROM mahrams WHERE user_id = creator_id
    --   ))
  )
);

CREATE POLICY "users can create own posts"
ON public."POST"
FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can edit own posts"
ON public."POST"
FOR UPDATE
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "users can delete own posts"
ON public."POST"
FOR DELETE
USING (creator_id = auth.uid());
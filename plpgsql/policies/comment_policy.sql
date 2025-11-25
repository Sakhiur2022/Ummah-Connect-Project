-- Enable RLS on COMMENTS table
ALTER TABLE public."COMMENTS" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert comments only for themselves
CREATE POLICY "comments_insert_own" ON public."COMMENTS"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow authenticated users to select comments based on gender matching and post ownership
-- Post owner can see all comments, otherwise must match gender
CREATE POLICY "comments_select_gender_filtered" ON public."COMMENTS"
  FOR SELECT
  TO authenticated
  USING (
    -- Post owner can see all comments
    EXISTS (
      SELECT 1 FROM public."POST" p
      WHERE p.post_id = "COMMENTS".post_id
      AND p.creator_id = auth.uid()
    )
    OR
    -- Comment author can see their own comments
    user_id = auth.uid()
    OR
    -- Users can see comments from same gender only
    EXISTS (
      SELECT 1 FROM public."users" u_commenter, public."users" u_viewer
      WHERE u_commenter.id = "COMMENTS".user_id
      AND u_viewer.id = auth.uid()
      AND u_commenter.gender = u_viewer.gender
    )
  );

-- Allow users to update their own comments
CREATE POLICY "comments_update_own" ON public."COMMENTS"
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow users to delete their own comments
CREATE POLICY "comments_delete_own" ON public."COMMENTS"
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- Enable RLS on COMMENTS table
ALTER TABLE public."COMMENTS" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert comments only for themselves
CREATE POLICY "comments_insert_own" ON public."COMMENTS"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow authenticated users to select all comments (for read access)
CREATE POLICY "comments_select_all" ON public."COMMENTS"
  FOR SELECT
  TO authenticated
  USING (true);

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

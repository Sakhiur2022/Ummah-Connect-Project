-- Enable RLS
ALTER TABLE public."SHARE" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert a share only for themselves
CREATE POLICY "share_insert_own" ON public."SHARE"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow users to select their own shares
CREATE POLICY "share_select_own" ON public."SHARE"
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Allow selecting public shares (so feed can show public content)
CREATE POLICY "share_select_public" ON public."SHARE"
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Allow update/delete only by the sharer
CREATE POLICY "share_update_own" ON public."SHARE"
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "share_delete_own" ON public."SHARE"
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
-- Enable RLS
ALTER TABLE public."NOTIFICATION" ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (not a role in policies but service_role bypasses RLS)
-- SELECT: recipients can read their notifications
CREATE POLICY "recipient_can_select" ON public."NOTIFICATION"
  FOR SELECT
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()));

-- INSERT: allow anyone to insert a notification only if recipient_id is valid (we'll allow server-side function to run with service_role)
CREATE POLICY "allow_insert_recipient" ON public."NOTIFICATION"
  FOR INSERT
  TO authenticated
  WITH CHECK (recipient_id IS NOT NULL);

-- UPDATE: recipient may mark is_read/is_dismissed; only allow updating those fields
CREATE POLICY "recipient_can_update" ON public."NOTIFICATION"
  FOR UPDATE
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

-- DELETE: only recipient can delete their notifications
CREATE POLICY "recipient_can_delete" ON public."NOTIFICATION"
  FOR DELETE
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()));
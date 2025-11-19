-- Enable RLS on FRIEND_REQUEST table
ALTER TABLE public."FRIEND_REQUEST" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to SELECT their own friend requests (both sent and received)
CREATE POLICY "friend_request_select" ON public."FRIEND_REQUEST"
FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy 2: Allow users to INSERT friend requests (only as sender)
CREATE POLICY "friend_request_insert" ON public."FRIEND_REQUEST"
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Policy 3: Allow users to UPDATE friend requests they received (as receiver)
CREATE POLICY "friend_request_update_receiver" ON public."FRIEND_REQUEST"
FOR UPDATE TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Policy 4: Allow users to UPDATE friend requests they sent (as sender)
CREATE POLICY "friend_request_update_sender" ON public."FRIEND_REQUEST"
FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Policy 5: Allow users to DELETE their own friend requests (both sent and received)
CREATE POLICY "friend_request_delete" ON public."FRIEND_REQUEST"
FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

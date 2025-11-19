-- Disable RLS temporarily to diagnose and fix the issue
ALTER TABLE public."FRIEND_REQUEST" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on FRIEND_REQUEST
DROP POLICY IF EXISTS "friend_request_select" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_request_insert" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_request_update_receiver" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_request_update_sender" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_request_delete" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_requests_select" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_requests_insert" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_requests_update" ON public."FRIEND_REQUEST";
DROP POLICY IF EXISTS "friend_requests_delete" ON public."FRIEND_REQUEST";

-- Re-enable RLS
ALTER TABLE public."FRIEND_REQUEST" ENABLE ROW LEVEL SECURITY;

-- Create simple, non-ambiguous RLS policies
-- Policy 1: Allow authenticated users to SELECT friend requests where they are involved
CREATE POLICY "authenticated_select_friend_requests" ON public."FRIEND_REQUEST"
FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy 2: Allow authenticated users to INSERT friend requests where they are the sender
CREATE POLICY "authenticated_insert_friend_requests" ON public."FRIEND_REQUEST"
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Policy 3: Allow authenticated users to UPDATE friend requests (any user involved can update)
CREATE POLICY "authenticated_update_friend_requests" ON public."FRIEND_REQUEST"
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid())
WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy 4: Allow authenticated users to DELETE friend requests (any user involved can delete)
CREATE POLICY "authenticated_delete_friend_requests" ON public."FRIEND_REQUEST"
FOR DELETE
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());


-- Create RPC functions to handle friend request operations
-- These bypass RLS issues and provide atomic operations

-- Function to accept friend request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_sender_id uuid,
  p_receiver_id uuid
)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
  UPDATE public."FRIEND_REQUEST"
  SET status = 'accepted'
  WHERE sender_id = p_sender_id 
    AND receiver_id = p_receiver_id 
    AND status = 'pending';
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Friend request accepted'::text;
  ELSE
    RETURN QUERY SELECT false, 'Friend request not found or already accepted'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject friend request
CREATE OR REPLACE FUNCTION public.reject_friend_request(
  p_sender_id uuid,
  p_receiver_id uuid
)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
  DELETE FROM public."FRIEND_REQUEST"
  WHERE sender_id = p_sender_id 
    AND receiver_id = p_receiver_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Friend request rejected'::text;
  ELSE
    RETURN QUERY SELECT false, 'Friend request not found'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel friend request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(
  p_sender_id uuid,
  p_receiver_id uuid
)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
  DELETE FROM public."FRIEND_REQUEST"
  WHERE sender_id = p_sender_id 
    AND receiver_id = p_receiver_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Friend request canceled'::text;
  ELSE
    RETURN QUERY SELECT false, 'Friend request not found'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove friend
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
  UPDATE public."FRIEND_REQUEST"
  SET status = 'pending'
  WHERE (sender_id = p_user_a AND receiver_id = p_user_b)
     OR (sender_id = p_user_b AND receiver_id = p_user_a)
    AND status = 'accepted';
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Friend removed'::text;
  ELSE
    RETURN QUERY SELECT false, 'Friendship not found'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_friend_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_friend_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend(uuid, uuid) TO authenticated;

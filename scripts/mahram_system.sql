-- Mahram System Setup
-- This file contains triggers and functions for the mahram relationship system

-- 1. Add column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS allow_mahram_requests_from_strangers BOOLEAN DEFAULT TRUE;

-- 2. Create mahram rejection cooldown tracking table
CREATE TABLE IF NOT EXISTS public."MAHRAM_REJECTION_COOLDOWN" (
  cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_days INT DEFAULT 7,
  cooldown_expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_rejection_pair UNIQUE(requester_id, target_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mahram_cooldown_requester ON public."MAHRAM_REJECTION_COOLDOWN"(requester_id);
CREATE INDEX IF NOT EXISTS idx_mahram_cooldown_target ON public."MAHRAM_REJECTION_COOLDOWN"(target_id);
CREATE INDEX IF NOT EXISTS idx_mahram_cooldown_expires ON public."MAHRAM_REJECTION_COOLDOWN"(cooldown_expires_at);

-- 3. Trigger to create notification when mahram request is created
CREATE OR REPLACE FUNCTION public.notify_mahram_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."NOTIFICATION" (
    recipient_id,
    actor_id,
    verb,
    object_type,
    object_id,
    data,
    is_read,
    priority,
    created_at
  ) VALUES (
    NEW.related_user_id,
    NEW.user_id,
    'mahram_request',
    'mahram',
    NEW.mahram_id,
    jsonb_build_object(
      'requester_name', (SELECT full_name FROM public.users WHERE id = NEW.user_id),
      'requester_username', (SELECT username FROM public.users WHERE id = NEW.user_id),
      'requester_image', (SELECT profile_image FROM public.users WHERE id = NEW.user_id)
    ),
    FALSE,
    1,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_mahram_request ON public."MAHRAM";

-- Create trigger for mahram request notifications
CREATE TRIGGER trigger_notify_mahram_request
AFTER INSERT ON public."MAHRAM"
FOR EACH ROW
WHEN (NEW.approved = FALSE)
EXECUTE FUNCTION public.notify_mahram_request();

-- 4. Trigger to create notification when mahram is approved
CREATE OR REPLACE FUNCTION public.notify_mahram_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
    INSERT INTO public."NOTIFICATION" (
      recipient_id,
      actor_id,
      verb,
      object_type,
      object_id,
      data,
      is_read,
      priority,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.related_user_id,
      'mahram_approved',
      'mahram',
      NEW.mahram_id,
      jsonb_build_object(
        'approver_name', (SELECT full_name FROM public.users WHERE id = NEW.related_user_id),
        'approver_username', (SELECT username FROM public.users WHERE id = NEW.related_user_id),
        'relation_type', (SELECT name FROM public."MAHRAM_RELATION_TYPE" WHERE relation_id = NEW.relation_id)
      ),
      FALSE,
      1,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_mahram_approved ON public."MAHRAM";

-- Create trigger for mahram approval notifications
CREATE TRIGGER trigger_notify_mahram_approved
AFTER UPDATE ON public."MAHRAM"
FOR EACH ROW
EXECUTE FUNCTION public.notify_mahram_approved();

-- 5. Function to check if user can send mahram request with detailed cooldown info
CREATE OR REPLACE FUNCTION public.can_send_mahram_request(
  p_requester_id UUID,
  p_target_id UUID
)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  cooldown_remaining_days FLOAT,
  cooldown_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_requester_gender TEXT;
  v_target_gender TEXT;
  v_target_allow_requests BOOLEAN;
  v_existing_request BOOLEAN;
  v_cooldown_expires_at TIMESTAMPTZ;
  v_cooldown_days INT := 7;
  v_days_remaining FLOAT;
BEGIN
  -- Get genders
  SELECT gender INTO v_requester_gender FROM public.users WHERE id = p_requester_id;
  SELECT gender, allow_mahram_requests_from_strangers INTO v_target_gender, v_target_allow_requests FROM public.users WHERE id = p_target_id;

  -- Same gender cannot use mahram system
  IF v_requester_gender = v_target_gender THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Same gender users cannot use mahram system'::TEXT, NULL::FLOAT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check if target allows requests from strangers
  IF v_target_allow_requests = FALSE THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'This user does not accept mahram requests from strangers'::TEXT, NULL::FLOAT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check for existing active request
  SELECT EXISTS(
    SELECT 1 FROM public."MAHRAM"
    WHERE user_id = p_requester_id AND related_user_id = p_target_id
  ) INTO v_existing_request;

  IF v_existing_request THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Mahram request already exists'::TEXT, NULL::FLOAT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check rejection cooldown (7 days after rejection)
  SELECT mrc.cooldown_expires_at INTO v_cooldown_expires_at
  FROM public."MAHRAM_REJECTION_COOLDOWN" mrc
  WHERE mrc.requester_id = p_requester_id AND mrc.target_id = p_target_id
  AND mrc.cooldown_expires_at > NOW()
  LIMIT 1;

  IF v_cooldown_expires_at IS NOT NULL THEN
    v_days_remaining := EXTRACT(DAY FROM (v_cooldown_expires_at - NOW()))
      + (EXTRACT(HOUR FROM (v_cooldown_expires_at - NOW())) / 24.0);
    RETURN QUERY SELECT FALSE::BOOLEAN, 
      'Mahram request on cooldown after rejection. Please wait ' || CEIL(v_days_remaining) || ' more days before trying again.',
      v_days_remaining,
      v_cooldown_expires_at;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Can send mahram request'::TEXT, NULL::FLOAT, NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to check if user can view profile
CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_viewer_id UUID,
  p_profile_owner_id UUID
)
RETURNS TABLE (
  can_view BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_viewer_gender TEXT;
  v_owner_gender TEXT;
  v_mahram_approved BOOLEAN;
BEGIN
  -- Same user can always view their own profile
  IF p_viewer_id = p_profile_owner_id THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Viewing own profile'::TEXT;
    RETURN;
  END IF;

  -- Get genders
  SELECT gender INTO v_viewer_gender FROM public.users WHERE id = p_viewer_id;
  SELECT gender INTO v_owner_gender FROM public.users WHERE id = p_profile_owner_id;

  -- Same gender can view each other
  IF v_viewer_gender = v_owner_gender THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Same gender can view'::TEXT;
    RETURN;
  END IF;

  -- If female viewing male or male viewing female, check mahram status
  -- Male viewing female requires approved mahram
  IF v_viewer_gender = 'male' AND v_owner_gender = 'female' THEN
    SELECT approved INTO v_mahram_approved
    FROM public."MAHRAM"
    WHERE user_id = p_viewer_id AND related_user_id = p_profile_owner_id
    AND approved = TRUE;

    IF v_mahram_approved THEN
      RETURN QUERY SELECT TRUE::BOOLEAN, 'Approved as mahram'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE::BOOLEAN, 'Profile is protected - mahram approval required'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Female viewing male (always allowed)
  IF v_viewer_gender = 'female' AND v_owner_gender = 'male' THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Female can view male profile'::TEXT;
    RETURN;
  END IF;

  -- Default deny
  RETURN QUERY SELECT FALSE::BOOLEAN, 'Access denied'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to send mahram request
CREATE OR REPLACE FUNCTION public.send_mahram_request(
  p_requester_id UUID,
  p_target_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  mahram_id UUID
) AS $$
DECLARE
  v_new_mahram_id UUID;
  v_can_send BOOLEAN;
  v_reason TEXT;
  v_cooldown_remaining_days FLOAT;
  v_cooldown_expires_at TIMESTAMPTZ;
BEGIN
  -- Check if user can send request
  SELECT can_send, reason, cooldown_remaining_days, cooldown_expires_at 
  INTO v_can_send, v_reason, v_cooldown_remaining_days, v_cooldown_expires_at
  FROM public.can_send_mahram_request(p_requester_id, p_target_id);

  IF NOT v_can_send THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, v_reason, NULL::UUID;
    RETURN;
  END IF;

  -- Insert mahram request
  INSERT INTO public."MAHRAM" (user_id, related_user_id, approved)
  VALUES (p_requester_id, p_target_id, FALSE)
  RETURNING public."MAHRAM".mahram_id INTO v_new_mahram_id;

  RETURN QUERY SELECT TRUE::BOOLEAN, 'Mahram request sent successfully'::TEXT, v_new_mahram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to approve mahram request
CREATE OR REPLACE FUNCTION public.approve_mahram_request(
  p_mahram_id UUID,
  p_relation_id SMALLINT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_mahram RECORD;
BEGIN
  -- Get mahram record
  SELECT * INTO v_mahram FROM public."MAHRAM" WHERE mahram_id = p_mahram_id;

  IF v_mahram IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Mahram request not found'::TEXT;
    RETURN;
  END IF;

  -- Update mahram
  UPDATE public."MAHRAM"
  SET approved = TRUE, relation_id = p_relation_id, updated_at = NOW()
  WHERE mahram_id = p_mahram_id;

  RETURN QUERY SELECT TRUE::BOOLEAN, 'Mahram request approved'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to reject/delete mahram request with cooldown tracking
CREATE OR REPLACE FUNCTION public.reject_mahram_request(
  p_mahram_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_mahram RECORD;
BEGIN
  -- Get mahram record before deletion
  SELECT * INTO v_mahram FROM public."MAHRAM" WHERE mahram_id = p_mahram_id;

  IF v_mahram IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Mahram request not found'::TEXT;
    RETURN;
  END IF;

  -- Create cooldown record for rejection (7 days)
  INSERT INTO public."MAHRAM_REJECTION_COOLDOWN" (
    requester_id,
    target_id,
    cooldown_days,
    cooldown_expires_at,
    reason
  ) VALUES (
    v_mahram.user_id,
    v_mahram.related_user_id,
    7,
    NOW() + INTERVAL '7 days',
    'Mahram request rejected by recipient'
  )
  ON CONFLICT (requester_id, target_id) DO UPDATE SET
    cooldown_expires_at = NOW() + INTERVAL '7 days',
    rejected_at = NOW(),
    reason = 'Mahram request rejected by recipient';

  -- Delete the mahram request
  DELETE FROM public."MAHRAM" WHERE mahram_id = p_mahram_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Mahram request rejected. Please try again after 7 days.'::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Mahram request not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to get mahram status between two users with cooldown info
CREATE OR REPLACE FUNCTION public.get_mahram_status_with_cooldown(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS TABLE (
  status TEXT,
  approved BOOLEAN,
  relation_type TEXT,
  cooldown_active BOOLEAN,
  cooldown_expires_at TIMESTAMPTZ,
  days_until_available FLOAT
) AS $$
DECLARE
  v_mahram RECORD;
  v_cooldown RECORD;
BEGIN
  -- Check for active mahram request
  SELECT * INTO v_mahram FROM public."MAHRAM"
  WHERE (user_id = p_user_a AND related_user_id = p_user_b)
     OR (user_id = p_user_b AND related_user_id = p_user_a);

  -- Check for cooldown
  SELECT * INTO v_cooldown FROM public."MAHRAM_REJECTION_COOLDOWN"
  WHERE (requester_id = p_user_a AND target_id = p_user_b)
  AND cooldown_expires_at > NOW();

  IF v_mahram IS NULL AND v_cooldown IS NULL THEN
    RETURN QUERY SELECT 'none'::TEXT, FALSE::BOOLEAN, NULL::TEXT, FALSE::BOOLEAN, NULL::TIMESTAMPTZ, NULL::FLOAT;
    RETURN;
  END IF;

  IF v_cooldown IS NOT NULL AND (v_mahram IS NULL OR v_mahram.approved = FALSE) THEN
    RETURN QUERY SELECT 'cooldown'::TEXT, FALSE::BOOLEAN, NULL::TEXT, TRUE::BOOLEAN, 
      v_cooldown.cooldown_expires_at,
      EXTRACT(DAY FROM (v_cooldown.cooldown_expires_at - NOW()))
      + (EXTRACT(HOUR FROM (v_cooldown.cooldown_expires_at - NOW())) / 24.0);
    RETURN;
  END IF;

  IF v_mahram IS NOT NULL AND v_mahram.approved = FALSE THEN
    RETURN QUERY SELECT 'pending'::TEXT, FALSE::BOOLEAN, NULL::TEXT, FALSE::BOOLEAN, NULL::TIMESTAMPTZ, NULL::FLOAT;
    RETURN;
  END IF;

  IF v_mahram IS NOT NULL AND v_mahram.approved = TRUE THEN
    RETURN QUERY SELECT 'approved'::TEXT, TRUE::BOOLEAN, 
      (SELECT name FROM public."MAHRAM_RELATION_TYPE" WHERE relation_id = v_mahram.relation_id)::TEXT,
      FALSE::BOOLEAN, NULL::TIMESTAMPTZ, NULL::FLOAT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'unknown'::TEXT, FALSE::BOOLEAN, NULL::TEXT, FALSE::BOOLEAN, NULL::TIMESTAMPTZ, NULL::FLOAT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to get mahram status between two users
CREATE OR REPLACE FUNCTION public.get_mahram_status(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS TABLE (
  status TEXT,
  approved BOOLEAN,
  relation_type TEXT
) AS $$
DECLARE
  v_mahram RECORD;
BEGIN
  SELECT * INTO v_mahram FROM public."MAHRAM"
  WHERE (user_id = p_user_a AND related_user_id = p_user_b)
     OR (user_id = p_user_b AND related_user_id = p_user_a);

  IF v_mahram IS NULL THEN
    RETURN QUERY SELECT 'none'::TEXT, FALSE::BOOLEAN, NULL::TEXT;
    RETURN;
  END IF;

  IF v_mahram.approved = FALSE THEN
    RETURN QUERY SELECT 'pending'::TEXT, FALSE::BOOLEAN, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'approved'::TEXT, TRUE::BOOLEAN, 
    (SELECT name FROM public."MAHRAM_RELATION_TYPE" WHERE relation_id = v_mahram.relation_id)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to get remaining cooldown time for a specific pair
CREATE OR REPLACE FUNCTION public.get_mahram_cooldown_info(
  p_requester_id UUID,
  p_target_id UUID
)
RETURNS TABLE (
  has_cooldown BOOLEAN,
  expires_at TIMESTAMPTZ,
  days_remaining FLOAT,
  hours_remaining FLOAT,
  formatted_time TEXT
) AS $$
DECLARE
  v_cooldown_expires_at TIMESTAMPTZ;
  v_days FLOAT;
  v_hours FLOAT;
BEGIN
  SELECT mrc.cooldown_expires_at INTO v_cooldown_expires_at 
  FROM public."MAHRAM_REJECTION_COOLDOWN" mrc
  WHERE mrc.requester_id = p_requester_id AND mrc.target_id = p_target_id
  AND mrc.cooldown_expires_at > NOW();

  IF v_cooldown_expires_at IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, NULL::TIMESTAMPTZ, NULL::FLOAT, NULL::FLOAT, NULL::TEXT;
    RETURN;
  END IF;

  v_days := EXTRACT(DAY FROM (v_cooldown_expires_at - NOW()));
  v_hours := EXTRACT(HOUR FROM (v_cooldown_expires_at - NOW()))
           + (EXTRACT(MINUTE FROM (v_cooldown_expires_at - NOW())) / 60.0);

  RETURN QUERY SELECT TRUE::BOOLEAN, 
    v_cooldown_expires_at,
    v_days + (v_hours / 24.0),
    v_hours,
    CASE 
      WHEN v_days > 0 THEN v_days::TEXT || ' days ' || FLOOR(v_hours)::TEXT || ' hours'
      ELSE FLOOR(v_hours)::TEXT || ' hours ' || ROUND(((v_hours * 60)::INTEGER % 60))::TEXT || ' minutes'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

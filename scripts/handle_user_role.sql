-- Create function to handle user role assignment
CREATE OR REPLACE FUNCTION public.handle_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  -- Assign default "user" role to the new user
  INSERT INTO public."USER_ROLE" (user_id, role_id)
  SELECT 
    NEW.id,
    r.role_id
  FROM public."ROLE" r
  WHERE r.role_name = 'user'
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to assign default role to user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on users table to assign default role
DROP TRIGGER IF EXISTS on_user_role_assignment ON public.users;
CREATE TRIGGER on_user_role_assignment
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role();

-- Grant necessary permissions
GRANT SELECT ON public."ROLE" TO authenticated;
GRANT SELECT ON public."USER_ROLE" TO authenticated;
GRANT INSERT ON public."USER_ROLE" TO service_role;

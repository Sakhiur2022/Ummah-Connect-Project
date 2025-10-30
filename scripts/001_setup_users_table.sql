-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
CREATE POLICY "Allow users to view their own data" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own data" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own data" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow anonymous users to check if username exists (for signup validation)
-- CREATE POLICY "Allow anonymous username check" ON public.users 
--   FOR SELECT USING (auth.uid() IS NULL);

-- Create a function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users WHERE username = username_to_check
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.check_username_availability(text) TO anon;

-- Create a trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  user_username text;
  user_full_name text;
  user_gender text;
  user_dob date;
BEGIN
  -- Extract user metadata
  user_username := COALESCE(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8));
  user_full_name := COALESCE(new.raw_user_meta_data ->> 'full_name', 'New User');
  user_gender := new.raw_user_meta_data ->> 'gender';
  user_dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE username = user_username) THEN
    RAISE EXCEPTION 'Username % is already taken. Please choose a different username.', user_username;
  END IF;
  
  INSERT INTO public.users (id, username, full_name, gender, date_of_birth)
  VALUES (
    new.id,
    user_username,
    user_full_name,
    user_gender,
    user_dob
  );
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username % is already taken. Please choose a different username.', user_username;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user profile: %', SQLERRM;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

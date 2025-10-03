-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
CREATE POLICY "Allow users to view their own data" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own data" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own data" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'New User')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

create table public.users (
  id uuid not null,
  username text not null,
  full_name text null,
  gender text null,
  date_of_birth date null,
  country text null,
  profile_image text null,
  bio text null,
  is_verified boolean null default false,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_gender_check check (
    (
      gender = any (array['male'::text, 'female'::text])
    )
  )
) TABLESPACE pg_default;
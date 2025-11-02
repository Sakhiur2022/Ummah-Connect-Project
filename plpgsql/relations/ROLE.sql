create table public."ROLE" (
  role_id serial not null,
  role_name text not null,
  description text null,
  constraint ROLE_pkey primary key (role_id),
  constraint ROLE_role_name_key unique (role_name),
  constraint ROLE_role_name_check check (
    (
      role_name = any (
        array[
          'super_admin'::text,
          'admin'::text,
          'moderator'::text,
          'user'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
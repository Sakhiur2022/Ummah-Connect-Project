create table public."USER_ROLE" (
  user_id uuid not null,
  role_id integer not null,
  assigned_at timestamp with time zone null default now(),
  constraint USER_ROLE_pkey primary key (user_id),
  constraint USER_ROLE_role_id_fkey foreign KEY (role_id) references "ROLE" (role_id) on delete RESTRICT,
  constraint USER_ROLE_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
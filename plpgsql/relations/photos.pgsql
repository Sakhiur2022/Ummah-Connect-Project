create table public."PHOTOS" (
  id uuid not null default gen_random_uuid (),
  url text not null,
  caption text not null,
  uid uuid not null,
  constraint PHOTOS_pkey primary key (id),
  constraint PHOTOS_uid_fkey foreign KEY (uid) references users (id)
) TABLESPACE pg_default;

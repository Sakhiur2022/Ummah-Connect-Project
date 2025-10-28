create table public."COMMUNITY" (
  id uuid not null default gen_random_uuid (),
  name text not null,
  creator_id uuid not null,
  constraint COMMUNITY_pkey primary key (id),
  constraint COMMUNITY_creator_id_fkey foreign KEY (creator_id) references users (id)
) TABLESPACE pg_default;

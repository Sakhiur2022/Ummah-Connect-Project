create table public."REACT" (
  react_id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  post_id bigint not null,
  reaction_type_id smallint not null,
  reacted_at timestamp with time zone null default now(),
  constraint REACT_pkey primary key (react_id),
  constraint REACT_user_id_post_id_key unique (user_id, post_id),
  constraint REACT_post_id_fkey foreign KEY (post_id) references "POST" (post_id) on delete CASCADE,
  constraint REACT_reaction_type_id_fkey foreign KEY (reaction_type_id) references "REACTION_TYPE" (reaction_type_id) on delete RESTRICT,
  constraint REACT_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

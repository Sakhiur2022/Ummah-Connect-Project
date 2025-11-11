create table public."COMMENTS" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  content text null,
  created_at timestamp with time zone null default now(),
  post_id bigint null,
  constraint COMMENTS_pkey primary key (id),
  constraint COMMENTS_post_id_fkey foreign KEY (post_id) references "POST" (post_id),
  constraint COMMENTS_user_id_fkey foreign KEY (user_id) references users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_bcnf_comment_delete
after DELETE on "COMMENTS" for EACH row
execute FUNCTION bcnf_decrement_comment ();

create trigger trg_bcnf_comment_insert
after INSERT on "COMMENTS" for EACH row
execute FUNCTION bcnf_increment_comment ();
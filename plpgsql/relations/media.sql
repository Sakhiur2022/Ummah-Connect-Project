create table public."MEDIA" (
  media_id uuid not null default gen_random_uuid (),
  post_id bigint not null,
  file_name text not null,
  file_url text not null,
  media_type text not null default 'image'::text,
  storage_bucket text not null default 'post-media'::text,
  uploaded_at timestamp with time zone null default now(),
  uploaded_by uuid not null,
  constraint MEDIA_pkey primary key (media_id),
  constraint MEDIA_post_id_fkey foreign KEY (post_id) references "POST" (post_id) on delete CASCADE,
  constraint MEDIA_uploaded_by_fkey foreign KEY (uploaded_by) references users (id) on delete CASCADE,
  constraint MEDIA_media_type_check check (
    (
      media_type = any (
        array['image'::text, 'video'::text, 'audio'::text]
      )
    )
  )
) TABLESPACE pg_default;
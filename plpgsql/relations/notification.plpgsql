create table public."NOTIFICATION" (
  notification_id uuid not null default gen_random_uuid (),
  recipient_id uuid not null,
  actor_id uuid null,
  verb text not null,
  object_type text null,
  object_id uuid null,
  object_id_bigint bigint null,
  data jsonb null,
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  priority smallint not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint NOTIFICATION_pkey primary key (notification_id),
  constraint notification_actor_fkey foreign KEY (actor_id) references users (id) on delete set null,
  constraint notification_recipient_fkey foreign KEY (recipient_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notification_recipient_created_at on public."NOTIFICATION" using btree (recipient_id, created_at desc) TABLESPACE pg_default;
create table public."MESSAGES" (
  id uuid not null default gen_random_uuid (),
  sender_id uuid not null,
  receiver_id uuid not null,
  sent_at timestamp with time zone not null default now(),
  status text not null default '''sent'''::text,
  content text not null,
  constraint MESSAGES_pkey primary key (id),
  constraint MESSAGES_receiver_id_fkey1 foreign KEY (receiver_id) references users (id),
  constraint MESSAGES_sender_id_fkey1 foreign KEY (sender_id) references users (id)
) TABLESPACE pg_default;

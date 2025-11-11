create table public."REPLY" (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  comment_id uuid null,
  content text null,
  created_at timestamp with time zone null default now(),
  constraint REPLY_pkey primary key (id),
  constraint REPLY_comment_id_fkey foreign KEY (comment_id) references "COMMENTS" (id) on update CASCADE on delete CASCADE,
  constraint REPLY_user_id_fkey foreign KEY (user_id) references public.users (id) on delete cascade
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public."REPLY" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all replies
CREATE POLICY "reply_select_all" ON public."REPLY"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert replies for themselves
CREATE POLICY "reply_insert_own" ON public."REPLY"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow users to delete their own replies
CREATE POLICY "reply_delete_own" ON public."REPLY"
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
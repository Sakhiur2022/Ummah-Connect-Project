CREATE TABLE public."MAHRAM" (
  mahram_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  related_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relation_id SMALLINT NOT NULL REFERENCES public."MAHRAM_RELATION_TYPE"(relation_id) ON DELETE RESTRICT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, related_user_id)
);

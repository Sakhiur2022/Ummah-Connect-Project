CREATE TABLE public."IBADAH_SESSION" (
  ibadah_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ibadah_type_id SMALLINT NOT NULL REFERENCES public."IBADAH_TYPE"(ibadah_type_id) ON DELETE RESTRICT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INT CHECK (duration_minutes >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public."IBADAH_POINT_LOG" (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibadah_id UUID REFERENCES public."IBADAH_SESSION"(ibadah_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points_earned INT DEFAULT 0,
  reason TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

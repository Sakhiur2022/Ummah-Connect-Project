CREATE TABLE public."DHIKR_RECORD" (
  dhikr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibadah_id UUID UNIQUE REFERENCES public."IBADAH_SESSION"(ibadah_id) ON DELETE CASCADE,
  dhikr_type TEXT,
  count INT CHECK (count >= 0)
);

CREATE TABLE public."SALAH_RECORD" (
  salah_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibadah_id UUID UNIQUE REFERENCES public."IBADAH_SESSION"(ibadah_id) ON DELETE CASCADE,
  salah_name TEXT CHECK (salah_name IN ('Fajr','Dhuhr','Asr','Maghrib','Isha')),
  status TEXT CHECK (status IN ('on_time','late','missed','jamaah')),
  location TEXT
);

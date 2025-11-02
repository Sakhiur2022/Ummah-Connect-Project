CREATE TABLE public."TILAWAH_RECORD" (
  tilawah_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibadah_id UUID UNIQUE REFERENCES public."IBADAH_SESSION"(ibadah_id) ON DELETE CASCADE,
  surah TEXT,
  ayah_start INT,
  ayah_end INT
);

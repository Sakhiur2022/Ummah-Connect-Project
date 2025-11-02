CREATE TABLE public."SALAH_STATUS_WEIGHT" (
  status_id SMALLSERIAL PRIMARY KEY,
  status_name TEXT UNIQUE NOT NULL CHECK (status_name IN ('jamaah','on_time','late','missed')),
  multiplier NUMERIC(4,2) NOT NULL,  -- < 0 for negative points
  description TEXT
);

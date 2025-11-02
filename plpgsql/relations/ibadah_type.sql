CREATE TABLE public."IBADAH_TYPE" (
  ibadah_type_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('salah','dhikr','tilawah','fasting')),
  description TEXT
);

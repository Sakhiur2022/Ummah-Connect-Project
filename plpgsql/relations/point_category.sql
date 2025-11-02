CREATE TABLE public."POINT_CATEGORY" (
  category_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('salah','tilawah','dhikr')),
  weight NUMERIC(4,2) NOT NULL CHECK (weight > 0),
  description TEXT
);

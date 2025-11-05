CREATE TABLE public."POINT_CATEGORY" (
  category_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('salah','tilawah','dhikr')),
  weight NUMERIC(4,2) NOT NULL CHECK (weight > 0),
  description TEXT
);

INSERT INTO public."POINT_CATEGORY" (name, weight, description) VALUES
('salah', 3.0, 'Prayer has highest reward'),
('tilawah', 2.0, 'Quran recitation reward'),
('dhikr', 1.0, 'Dhikr remembrance reward');
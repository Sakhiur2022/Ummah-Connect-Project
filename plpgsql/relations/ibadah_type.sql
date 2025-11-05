CREATE TABLE public."IBADAH_TYPE" (
  ibadah_type_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('salah','dhikr','tilawah','fasting')),
  description TEXT
);


INSERT INTO public."IBADAH_TYPE" (name, description)
VALUES
  ('salah',   'Five daily obligatory prayers in Islam'),
  ('dhikr',   'Remembrance of Allah through phrases and supplication'),
  ('tilawah', 'Recitation of the Holy Qur’an'),
  ('fasting', 'Observing fasts, primarily during the month of Ramadan');

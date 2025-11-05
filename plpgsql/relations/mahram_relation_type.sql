CREATE TABLE public."MAHRAM_RELATION_TYPE" (
  relation_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (
    name IN ('father','mother','brother','sister','son','daughter','uncle','aunt','grandparent','nephew','niece','spouse')
  ),
  gender_restriction TEXT CHECK (gender_restriction IN ('male','female','both')) DEFAULT 'both'
);

INSERT INTO public."MAHRAM_RELATION_TYPE" (name, gender_restriction)
VALUES
  ('father',        'female'),   -- Father is mahram for females
  ('mother',        'male'),     -- Mother is mahram for males
  ('brother',       'female'),
  ('sister',        'male'),
  ('son',           'female'),
  ('daughter',      'male'),
  ('uncle',         'female'),
  ('aunt',          'male'),
  ('grandparent',   'both'),     -- Applies to both genders
  ('nephew',        'female'),
  ('niece',         'male'),
  ('spouse',        'both');     -- Mutual mahram relationship

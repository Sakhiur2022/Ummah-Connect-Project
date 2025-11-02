CREATE TABLE public."MAHRAM_RELATION_TYPE" (
  relation_id SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (
    name IN ('father','mother','brother','sister','son','daughter','uncle','aunt','grandparent','nephew','niece','spouse')
  ),
  gender_restriction TEXT CHECK (gender_restriction IN ('male','female','both')) DEFAULT 'both'
);

CREATE TABLE public."POINT_LOG" (
  point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ibadah_id UUID REFERENCES public."IBADAH_SESSION"(ibadah_id) ON DELETE SET NULL,
  category_id SMALLINT NOT NULL REFERENCES public."POINT_CATEGORY"(category_id),
  base_points INT NOT NULL CHECK (base_points >= 0),
  total_points NUMERIC(6,2) GENERATED ALWAYS AS (base_points * (SELECT weight FROM public."POINT_CATEGORY" WHERE public."POINT_CATEGORY".category_id = category_id)) STORED,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1) Add the column as nullable (not generated)
ALTER TABLE public."POINT_LOG"
  DROP COLUMN IF EXISTS total_points;

ALTER TABLE public."POINT_LOG"
  ADD COLUMN total_points NUMERIC(6,2);

-- 2) Create function to compute and set total_points
CREATE OR REPLACE FUNCTION public.point_log_set_total_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_weight numeric;
BEGIN
  IF NEW.category_id IS NULL OR NEW.base_points IS NULL THEN
    NEW.total_points := NULL;
    RETURN NEW;
  END IF;

  SELECT weight
    INTO cat_weight
    FROM public."POINT_CATEGORY"
    WHERE category_id = NEW.category_id;

  IF NOT FOUND OR cat_weight IS NULL THEN
    -- If category missing, you can choose to raise or set to base_points (here we set NULL)
    NEW.total_points := NULL;
  ELSE
    NEW.total_points := (NEW.base_points * cat_weight)::numeric(6,2);
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Create trigger to fire BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_point_log_set_total_points ON public."POINT_LOG";

CREATE TRIGGER trg_point_log_set_total_points
BEFORE INSERT OR UPDATE ON public."POINT_LOG"
FOR EACH ROW
EXECUTE FUNCTION public.point_log_set_total_points();
CREATE OR REPLACE FUNCTION public.add_ibadah_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_id SMALLINT;
  base_value INT := 10; -- default base points per ibadah session
  base_w numeric;
  stat_mult numeric := 1;
BEGIN
  -- Find category_id for the ibadah type
  SELECT pc.category_id, pc.base_weight
    INTO cat_id, base_w
  FROM public."POINT_CATEGORY" pc
  JOIN public."IBADAH_TYPE" it ON it.name = pc.name
  WHERE it.ibadah_type_id = NEW.ibadah_type_id
  LIMIT 1;

  IF NOT FOUND OR cat_id IS NULL OR base_w IS NULL THEN
    RAISE EXCEPTION 'No POINT_CATEGORY mapping found for IBADAH_TYPE id=%', NEW.ibadah_type_id;
  END IF;

  -- If IBADAH_SESSION has status_id (optional), get multiplier; otherwise default 1
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'IBADAH_SESSION'
      AND column_name = 'status_id'
  ) THEN
    -- If session row includes status_id, use it; safe-select to avoid errors if NULL
    IF NEW.status_id IS NOT NULL THEN
      SELECT multiplier INTO stat_mult
      FROM public."SALAH_STATUS_WEIGHT"
      WHERE status_id = NEW.status_id;

      IF NOT FOUND OR stat_mult IS NULL THEN
        stat_mult := 1;
      END IF;
    END IF;
  END IF;

  -- Insert into POINT_LOG with computed total_points
  INSERT INTO public."POINT_LOG" (
    point_id,
    user_id,
    ibadah_id,
    category_id,
    base_points,
    total_points,
    earned_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.user_id,
    NEW.ibadah_id,
    cat_id,
    base_value,
    (base_value * base_w * COALESCE(stat_mult, 1))::numeric(6,2),
    NOW()
  );

  RETURN NEW;
END;
$$;
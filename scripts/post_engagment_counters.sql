-- Create counter tables and triggers referencing exact quoted table names in public schema

CREATE TABLE IF NOT EXISTS public.POST_COUNTER (
  post_id BIGINT PRIMARY KEY REFERENCES public."POST"(post_id) ON DELETE CASCADE,
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.POST_REACTION_COUNT (
  post_id BIGINT REFERENCES public."POST"(post_id) ON DELETE CASCADE,
  reaction_type_id SMALLINT REFERENCES public."REACTION_TYPE"(reaction_type_id) ON DELETE RESTRICT,
  reaction_count INTEGER DEFAULT 0 CHECK (reaction_count >= 0),
  PRIMARY KEY (post_id, reaction_type_id)
);

CREATE OR REPLACE FUNCTION public.bcnf_increment_reaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure base records exist
  INSERT INTO public.POST_COUNTER (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  INSERT INTO public.POST_REACTION_COUNT (post_id, reaction_type_id)
  VALUES (NEW.post_id, NEW.reaction_type_id)
  ON CONFLICT (post_id, reaction_type_id) DO NOTHING;

  -- Increment totals
  UPDATE public.POST_COUNTER
  SET total_reactions = total_reactions + 1
  WHERE post_id = NEW.post_id;

  UPDATE public.POST_REACTION_COUNT
  SET reaction_count = reaction_count + 1
  WHERE post_id = NEW.post_id
  AND reaction_type_id = NEW.reaction_type_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on quoted REACT table
DROP TRIGGER IF EXISTS trg_bcnf_react_insert ON public."REACT";
CREATE TRIGGER trg_bcnf_react_insert
AFTER INSERT ON public."REACT"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_reaction();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_reaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.POST_COUNTER
  SET total_reactions = GREATEST(total_reactions - 1, 0)
  WHERE post_id = OLD.post_id;

  UPDATE public.POST_REACTION_COUNT
  SET reaction_count = GREATEST(reaction_count - 1, 0)
  WHERE post_id = OLD.post_id
  AND reaction_type_id = OLD.reaction_type_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_react_delete ON public."REACT";
CREATE TRIGGER trg_bcnf_react_delete
AFTER DELETE ON public."REACT"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_reaction();

CREATE OR REPLACE FUNCTION public.bcnf_increment_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.POST_COUNTER (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  UPDATE public.POST_COUNTER
  SET total_comments = total_comments + 1
  WHERE post_id = NEW.post_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_comment_insert ON public."COMMENTS";
CREATE TRIGGER trg_bcnf_comment_insert
AFTER INSERT ON public."COMMENTS"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_comment();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.POST_COUNTER
  SET total_comments = GREATEST(total_comments - 1, 0)
  WHERE post_id = OLD.post_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_comment_delete ON public."COMMENTS";
CREATE TRIGGER trg_bcnf_comment_delete
AFTER DELETE ON public."COMMENTS"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_comment();

CREATE OR REPLACE FUNCTION public.bcnf_increment_share()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.POST_COUNTER (post_id)
  VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;

  UPDATE public.POST_COUNTER
  SET total_shares = total_shares + 1
  WHERE post_id = NEW.post_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_share_insert ON public."Share";
CREATE TRIGGER trg_bcnf_share_insert
AFTER INSERT ON public."Share"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_increment_share();

CREATE OR REPLACE FUNCTION public.bcnf_decrement_share()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.POST_COUNTER
  SET total_shares = GREATEST(total_shares - 1, 0)
  WHERE post_id = OLD.post_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bcnf_share_delete ON public."Share";
CREATE TRIGGER trg_bcnf_share_delete
AFTER DELETE ON public."Share"
FOR EACH ROW
EXECUTE FUNCTION public.bcnf_decrement_share();

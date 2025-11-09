-- ================================================
-- 🔹 STEP 1: Base View — Reaction Summary per Post
-- ================================================
CREATE OR REPLACE VIEW public.react_view AS
SELECT
  p.post_id,
  p.creator_id,
  rt.label AS reaction_type,
  COUNT(r.react_id) AS reaction_count
FROM public."POST" p
LEFT JOIN public."REACT" r ON p.post_id = r.post_id
LEFT JOIN public."REACTION_TYPE" rt ON r.reaction_type_id = rt.reaction_type_id
GROUP BY p.post_id, p.creator_id, rt.label;


-- ================================================
-- 🔹 STEP 2: Aggregate Reaction, Comment, and Share Count
-- ================================================
CREATE OR REPLACE VIEW public.post_engagement_summary AS
SELECT
  p.post_id,
  p.creator_id,

  -- 🩷 total reactions
  COALESCE(SUM(r_count.reaction_count), 0) AS total_reactions,

  -- 💬 total comments
  COALESCE(c.comment_count, 0) AS total_comments,

  -- 🔁 total shares
  COALESCE(s.share_count, 0) AS total_shares,

  -- 🏆 combined engagement score
  (COALESCE(SUM(r_count.reaction_count), 0)
   + COALESCE(c.comment_count, 0)
   + COALESCE(s.share_count, 0)) AS total_engagement

FROM public."POST" p
LEFT JOIN (
  SELECT post_id, COUNT(*) AS reaction_count
  FROM public."REACT"
  GROUP BY post_id
) AS r_count ON p.post_id = r_count.post_id

LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM public."COMMENTS"
  GROUP BY post_id
) AS c ON p.post_id = c.post_id

LEFT JOIN (
  SELECT post_id, COUNT(*) AS share_count
  FROM public."Share"
  GROUP BY post_id
) AS s ON p.post_id = s.post_id

GROUP BY p.post_id, p.creator_id, c.comment_count, s.share_count;


-- ================================================
-- 🔹 STEP 3: Rank Posts by Engagement per User
-- ================================================
CREATE OR REPLACE VIEW public.user_ranked_posts AS
SELECT
  pes.creator_id,
  pes.post_id,
  pes.total_reactions,
  pes.total_comments,
  pes.total_shares,
  pes.total_engagement,
  ROW_NUMBER() OVER (
    PARTITION BY pes.creator_id
    ORDER BY pes.total_engagement DESC
  ) AS rank
FROM public.post_engagement_summary pes;


-- ================================================
-- 🔹 STEP 4: Filter to Top 10 Posts per User
-- ================================================
CREATE OR REPLACE VIEW public.user_top10_posts AS
SELECT *
FROM public.user_ranked_posts
WHERE rank <= 10;


-- ================================================
-- 🔹 STEP 5: RLS — Restrict Access to Own Posts
-- (Assuming RLS is already enabled on POST)
-- ================================================
ALTER TABLE public."POST" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own top posts"
ON public."POST"
FOR SELECT
USING (auth.uid() = creator_id);
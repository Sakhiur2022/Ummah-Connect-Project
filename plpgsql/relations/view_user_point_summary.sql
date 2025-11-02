CREATE VIEW public."USER_POINT_SUMMARY" AS
SELECT
  u.id AS user_id,
  u.username,
  COALESCE(SUM(p.total_points), 0) AS total_points
FROM public.users u
LEFT JOIN public."POINT_LOG" p ON p.user_id = u.id
GROUP BY u.id, u.username;
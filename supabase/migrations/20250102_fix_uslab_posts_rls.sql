-- USLab 블로그 RLS 정책 보완
-- 마이그레이션 날짜: 2025-01-02
-- 목적: authenticated 사용자가 draft 포스트도 조회할 수 있도록 정책 추가

-- 기존 정책 확인 (필요시 drop)
-- drop policy if exists uslab_policy_posts_select_public on uslab_posts;

-- 옵션 1: authenticated 전용 SELECT 정책 추가 (권장)
create policy uslab_policy_posts_select_authenticated
  on uslab_posts
  for select
  using (auth.role() = 'authenticated');

-- 옵션 2: 기존 정책 수정 (대안)
-- drop policy if exists uslab_policy_posts_select_public on uslab_posts;
-- create policy uslab_policy_posts_select_public
--   on uslab_posts
--   for select
--   using (is_published = true OR auth.role() = 'authenticated');

-- 정책 확인 쿼리
-- select schemaname, tablename, policyname, permissive, roles, cmd, qual
-- from pg_policies
-- where tablename = 'uslab_posts';







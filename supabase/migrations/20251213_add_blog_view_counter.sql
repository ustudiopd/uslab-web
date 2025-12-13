-- 블로그 조회수 기능 추가
-- 마이그레이션 날짜: 2025-12-13

-- 1. 조회수 컬럼 추가
ALTER TABLE uslab_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- 2. 조회수 인덱스 생성 (인기 포스트 조회용)
CREATE INDEX IF NOT EXISTS uslab_idx_posts_view_count ON uslab_posts(view_count DESC);

-- 3. 기존 포스트의 조회수를 0으로 초기화
UPDATE uslab_posts SET view_count = 0 WHERE view_count IS NULL;

-- 4. 주석 추가
COMMENT ON COLUMN uslab_posts.view_count IS '포스트 조회수 (기본값: 0)';

-- 5. 조회수 증가 함수 생성
-- 원자적 증가를 보장하여 동시성 문제 방지
CREATE OR REPLACE FUNCTION uslab_increment_view_count(post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- 원자적으로 조회수 증가
  UPDATE uslab_posts
  SET view_count = view_count + 1
  WHERE id = post_id
    AND is_published = true  -- 발행된 포스트만 조회수 증가
  RETURNING view_count INTO new_count;
  
  -- 업데이트된 조회수 반환 (없으면 0)
  RETURN COALESCE(new_count, 0);
END;
$$;

-- 6. 함수 주석 추가
COMMENT ON FUNCTION uslab_increment_view_count(UUID) IS '포스트 조회수를 원자적으로 증가시키는 함수. 발행된 포스트만 조회수 증가.';

-- 7. anon 및 authenticated 역할에 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION uslab_increment_view_count(UUID) TO anon, authenticated;

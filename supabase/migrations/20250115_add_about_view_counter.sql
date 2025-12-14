-- 소개 페이지 조회수 기능 추가
-- 마이그레이션 날짜: 2025-01-15

-- 1. 조회수 컬럼 추가
ALTER TABLE uslab_about 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- 2. 조회수 인덱스 생성
CREATE INDEX IF NOT EXISTS uslab_idx_about_view_count ON uslab_about(view_count DESC);

-- 3. 기존 소개 페이지의 조회수를 0으로 초기화
UPDATE uslab_about SET view_count = 0 WHERE view_count IS NULL;

-- 4. 주석 추가
COMMENT ON COLUMN uslab_about.view_count IS '소개 페이지 조회수 (기본값: 0)';

-- 5. 조회수 증가 함수 생성
-- 원자적 증가를 보장하여 동시성 문제 방지
CREATE OR REPLACE FUNCTION uslab_increment_about_view_count(about_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- 원자적으로 조회수 증가
  UPDATE uslab_about
  SET view_count = view_count + 1
  WHERE id = about_id
  RETURNING view_count INTO new_count;
  
  -- 업데이트된 조회수 반환 (없으면 0)
  RETURN COALESCE(new_count, 0);
END;
$$;

-- 6. 함수 주석 추가
COMMENT ON FUNCTION uslab_increment_about_view_count(UUID) IS '소개 페이지 조회수를 원자적으로 증가시키는 함수.';

-- 7. anon 및 authenticated 역할에 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION uslab_increment_about_view_count(UUID) TO anon, authenticated;


-- 조회수 컬럼 추가
-- 마이그레이션 날짜: 2025-01-04

-- 조회수 컬럼 추가
ALTER TABLE uslab_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- 조회수 인덱스 생성 (인기 포스트 조회용)
CREATE INDEX IF NOT EXISTS uslab_idx_posts_view_count ON uslab_posts(view_count DESC);

-- 기존 포스트의 조회수를 0으로 초기화
UPDATE uslab_posts SET view_count = 0 WHERE view_count IS NULL;

-- 주석 추가
COMMENT ON COLUMN uslab_posts.view_count IS '포스트 조회수 (기본값: 0)';

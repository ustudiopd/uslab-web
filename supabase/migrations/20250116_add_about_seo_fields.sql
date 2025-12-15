-- 소개 페이지 SEO 필드 추가
-- 마이그레이션 날짜: 2025-01-16

-- 1. SEO 메타데이터 컬럼 추가
ALTER TABLE uslab_about 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- 2. 주석 추가
COMMENT ON COLUMN uslab_about.seo_title IS '검색 노출용 제목 (<title>)';
COMMENT ON COLUMN uslab_about.seo_description IS '검색 노출용 요약 (<meta name="description">)';
COMMENT ON COLUMN uslab_about.seo_keywords IS '키워드 태그 배열';



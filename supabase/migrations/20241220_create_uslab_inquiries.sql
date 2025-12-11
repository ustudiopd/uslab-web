-- USLab 문의 테이블 생성
-- uslab_ prefix를 사용하여 ustudio 프로젝트와 완전 분리

-- 문의 테이블
CREATE TABLE IF NOT EXISTS public.uslab_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS uslab_inquiries_created_at_idx ON public.uslab_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS uslab_inquiries_status_idx ON public.uslab_inquiries(status);

-- updated_at 자동 업데이트 함수 (uslab_ prefix)
CREATE OR REPLACE FUNCTION public.uslab_update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 트리거 생성
CREATE TRIGGER uslab_inquiries_updated_at_trigger
    BEFORE UPDATE ON public.uslab_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.uslab_update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE public.uslab_inquiries ENABLE ROW LEVEL SECURITY;

-- 공개 INSERT 정책 (문의 폼 제출용)
CREATE POLICY uslab_inquiries_insert_policy ON public.uslab_inquiries
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 서비스 롤만 SELECT 가능 (관리자용)
CREATE POLICY uslab_inquiries_select_policy ON public.uslab_inquiries
    FOR SELECT
    TO service_role
    USING (true);

-- 주석 추가
COMMENT ON TABLE public.uslab_inquiries IS 'USLab.ai 문의 폼 데이터 저장 테이블';
COMMENT ON COLUMN public.uslab_inquiries.status IS '문의 상태: pending(대기), contacted(연락완료), completed(처리완료)';



-- USLab 이미지 Storage 버킷 생성
-- 마이그레이션 날짜: 2025-01-03

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uslab-images',
  'uslab-images',
  true,  -- Public bucket (공개 접근 허용)
  10485760,  -- 10MB (10 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;  -- 이미 존재하면 무시

-- RLS 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "uslab_policy_images_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uslab-images');

-- RLS 정책: 모든 사용자가 읽기 가능 (Public bucket)
CREATE POLICY "uslab_policy_images_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uslab-images');

-- RLS 정책: 인증된 사용자만 업데이트 가능
CREATE POLICY "uslab_policy_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uslab-images')
WITH CHECK (bucket_id = 'uslab-images');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "uslab_policy_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uslab-images');







-- USLab Analytics Report Comments 테이블 생성
-- 마이그레이션 날짜: 2025-01-25
-- 목적: AI 분석 보고서에 대한 댓글 저장
--
-- 주요 기능:
-- 1. 보고서별 댓글 저장
-- 2. 관리자만 댓글 작성 가능 (인증 기반)
-- 3. 작성자 정보 저장 (user_id, user_email)
--
-- 보안:
-- - RLS 정책으로 authenticated 사용자만 조회/작성 가능
-- - 작성자는 자신의 댓글만 수정/삭제 가능

-- Analytics Report Comments 테이블
create table if not exists uslab_analytics_report_comments (
  id uuid primary key default gen_random_uuid(),
  
  -- 보고서 참조
  report_id uuid not null references uslab_analytics_reports(id) on delete cascade,
  
  -- 작성자 정보 (관리자)
  user_id uuid references auth.users(id) on delete set null,
  user_email text,  -- 사용자 이메일 (백업용)
  author_name text not null,  -- 표시용 이름
  
  -- 댓글 내용
  content text not null,
  
  -- 타임스탬프
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists uslab_idx_report_comments_report_id on uslab_analytics_report_comments (report_id, created_at desc);
create index if not exists uslab_idx_report_comments_user_id on uslab_analytics_report_comments (user_id);

-- updated_at 자동 업데이트 트리거
create or replace function uslab_update_report_comment_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_report_comment_updated_at
  before update on uslab_analytics_report_comments
  for each row
  execute function uslab_update_report_comment_updated_at();

-- RLS 활성화
alter table uslab_analytics_report_comments enable row level security;

-- RLS 정책: Authenticated 사용자만 조회 가능
create policy uslab_policy_report_comments_select_authenticated
  on uslab_analytics_report_comments
  for select
  using (auth.role() = 'authenticated');

-- RLS 정책: Authenticated 사용자만 작성 가능
create policy uslab_policy_report_comments_insert_authenticated
  on uslab_analytics_report_comments
  for insert
  with check (auth.role() = 'authenticated');

-- RLS 정책: 작성자만 수정 가능
create policy uslab_policy_report_comments_update_own
  on uslab_analytics_report_comments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS 정책: 작성자만 삭제 가능
create policy uslab_policy_report_comments_delete_own
  on uslab_analytics_report_comments
  for delete
  using (auth.uid() = user_id);

-- 주석 추가
comment on table uslab_analytics_report_comments is 'AI 분석 보고서 댓글 테이블';
comment on column uslab_analytics_report_comments.report_id is '참조하는 보고서 ID';
comment on column uslab_analytics_report_comments.user_id is '작성자 사용자 ID (auth.users 참조)';
comment on column uslab_analytics_report_comments.author_name is '표시용 작성자 이름';


-- USLab 블로그 댓글 시스템 테이블 생성
-- 마이그레이션 날짜: 2025-01-02

-- 댓글 테이블 (`uslab_comments`)
create table uslab_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references uslab_posts(id) on delete cascade not null,
  author_name text not null,              -- 작성자 이름
  password_hash text not null,             -- 비밀번호 해시 (수정/삭제용)
  content text not null,                   -- 댓글 내용
  is_approved boolean default true,       -- 승인 여부 (스팸 필터링용)
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성
create index uslab_idx_comments_post_id on uslab_comments(post_id, created_at desc);
create index uslab_idx_comments_approved on uslab_comments(is_approved, created_at desc);

-- updated_at 자동 업데이트 트리거
create or replace function uslab_update_comment_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_comment_updated_at
  before update on uslab_comments
  for each row
  execute function uslab_update_comment_updated_at();

-- RLS (Row Level Security) 정책
alter table uslab_comments enable row level security;

-- 공개 읽기 정책 (승인된 댓글만)
create policy uslab_policy_comments_select_public
  on uslab_comments
  for select
  using (is_approved = true);

-- 누구나 댓글 작성 가능
create policy uslab_policy_comments_insert_public
  on uslab_comments
  for insert
  with check (true);

-- 비밀번호 확인은 API 레벨에서 처리 (RLS에서는 모든 사용자가 수정/삭제 가능하도록 설정)
-- 실제 수정/삭제는 API에서 비밀번호 확인 후 처리
create policy uslab_policy_comments_update_public
  on uslab_comments
  for update
  using (true);

create policy uslab_policy_comments_delete_public
  on uslab_comments
  for delete
  using (true);



-- USLab 블로그 시스템 테이블 생성
-- 마이그레이션 날짜: 2025-01-01

-- A. 게시글 테이블 (`uslab_posts`)
create table uslab_posts (
  id uuid default gen_random_uuid() primary key,
  slug text not null,                   -- URL 경로 (예: /blog/ai-trend-2025)
  title text not null,                  -- 에디터 상단 제목
  content jsonb not null,               -- Tiptap JSON 데이터 (핵심)
  thumbnail_url text,                   -- 대표 이미지
  
  -- 다국어 지원
  locale text default 'ko' check (locale in ('ko', 'en')),  -- 포스트 언어
  canonical_id uuid references uslab_posts(id),             -- KOR/ENG 짝 연결
  -- canonical_id 사용 규칙:
  -- 1. 원본(한국어) 생성 시: canonical_id = id (self 참조)
  -- 2. 번역(영어) 생성 시: canonical_id = 원본 id
  -- 3. 같은 canonical_id를 가진 포스트들이 하나의 "글 그룹"
  
  -- SEO 메타 데이터 (AI 자동 생성)
  seo_title text,                       -- 검색 노출용 제목 ( <title> )
  seo_description text,                 -- 검색 노출용 요약 ( <meta name="description"> )
  seo_keywords text[],                  -- 키워드 태그 배열
  
  -- 상태 관리
  is_published boolean default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  author_id uuid references auth.users(id)
);

-- 인덱스 생성
-- (locale, slug) 조합으로 unique 제약 (같은 slug를 다른 언어에서 사용 가능)
create unique index uslab_idx_posts_locale_slug on uslab_posts(locale, slug);
create index uslab_idx_posts_published on uslab_posts(is_published, published_at desc);
create index uslab_idx_posts_created_at on uslab_posts(created_at desc);
create index uslab_idx_posts_locale on uslab_posts(locale, is_published, published_at desc);  -- 다국어 지원 인덱스
create index uslab_idx_posts_canonical on uslab_posts(canonical_id);  -- canonical_id 조회용 인덱스

-- updated_at 자동 업데이트 트리거
create or replace function uslab_update_post_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_post_updated_at
  before update on uslab_posts
  for each row
  execute function uslab_update_post_updated_at();

-- canonical_id 자동 설정 트리거 (원본 생성 시 self 참조)
create or replace function uslab_set_canonical_id()
returns trigger as $$
begin
  if new.canonical_id is null then
    new.canonical_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_set_canonical_id
  before insert on uslab_posts
  for each row
  execute function uslab_set_canonical_id();

-- B. 버전 관리 테이블 (`uslab_post_versions`)
create table uslab_post_versions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references uslab_posts(id) on delete cascade,
  content jsonb not null,               -- 당시 콘텐츠 스냅샷
  change_log text,                      -- 변경 사유 (예: "AI 톤앤매너 교정")
  created_at timestamp with time zone default now()
);

-- 인덱스 생성
create index uslab_idx_post_versions_post_id on uslab_post_versions(post_id, created_at desc);

-- C. RLS (Row Level Security) 정책
-- uslab_posts 테이블 RLS 활성화
alter table uslab_posts enable row level security;
alter table uslab_post_versions enable row level security;

-- 공개 읽기 정책 (발행된 포스트만)
create policy uslab_policy_posts_select_public
  on uslab_posts
  for select
  using (is_published = true);

-- 인증된 사용자만 작성/수정/삭제 (관리자 전용)
create policy uslab_policy_posts_insert_authenticated
  on uslab_posts
  for insert
  with check (auth.role() = 'authenticated');

create policy uslab_policy_posts_update_authenticated
  on uslab_posts
  for update
  using (auth.role() = 'authenticated');

create policy uslab_policy_posts_delete_authenticated
  on uslab_posts
  for delete
  using (auth.role() = 'authenticated');

-- 버전 관리 테이블 정책 (인증된 사용자만)
create policy uslab_policy_post_versions_select_authenticated
  on uslab_post_versions
  for select
  using (auth.role() = 'authenticated');

create policy uslab_policy_post_versions_insert_authenticated
  on uslab_post_versions
  for insert
  with check (auth.role() = 'authenticated');












-- USLab 트래킹 시스템 테이블 생성
-- 마이그레이션 날짜: 2025-01-15
-- 목적: 세션 및 페이지뷰 추적을 위한 테이블
-- 
-- 주요 기능:
-- 1. 세션 추적 (uslab_sessions): 방문자 세션 정보 저장
-- 2. 페이지뷰 추적 (uslab_page_views): 페이지별 조회 추적
-- 3. Retention 정리 함수: 90일 지난 데이터 자동 삭제
-- 
-- 보안:
-- - RLS 정책으로 authenticated 사용자만 조회 가능
-- - Insert는 /api/track에서 service role로 수행 (RLS 우회)

-- 1. 세션 테이블 (uslab_sessions)
create table if not exists uslab_sessions (
  id uuid primary key default gen_random_uuid(),
  
  -- 클라이언트 쿠키 기반 세션 키(유니크)
  session_key text not null,
  
  -- entry(첫 유입) 정보
  landing_path text,
  referrer text,
  referrer_host text,
  
  -- 캠페인(UTM)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- 디바이스/환경
  user_agent text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  
  -- 운영 편의
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- 세션 키 유니크 인덱스
create unique index if not exists uslab_idx_sessions_session_key on uslab_sessions (session_key);

-- 세션 인덱스 생성
create index if not exists uslab_idx_sessions_created_at on uslab_sessions (created_at desc);
create index if not exists uslab_idx_sessions_last_seen_at on uslab_sessions (last_seen_at desc);
create index if not exists uslab_idx_sessions_referrer_host on uslab_sessions (referrer_host);
create index if not exists uslab_idx_sessions_utm_campaign on uslab_sessions (utm_campaign);

-- RLS 활성화
alter table uslab_sessions enable row level security;

-- RLS 정책: Admin(authenticated)만 조회 가능
create policy if not exists uslab_policy_sessions_select_authenticated
  on uslab_sessions
  for select
  using (auth.role() = 'authenticated');

-- 주석 추가
comment on table uslab_sessions is 'USLab.ai 방문자 세션 추적 테이블';
comment on column uslab_sessions.session_key is '클라이언트에서 생성한 세션 키 (localStorage 기반)';
comment on column uslab_sessions.landing_path is '첫 유입 경로';
comment on column uslab_sessions.referrer_host is '유입 경로 호스트 (www 제거)';
comment on column uslab_sessions.device_type is '디바이스 타입: mobile/tablet/desktop/bot/unknown';

-- 2. 페이지뷰 테이블 (uslab_page_views)
create table if not exists uslab_page_views (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references uslab_sessions(id) on delete cascade,
  
  -- 콘텐츠 매핑(가능하면 저장; 없으면 null)
  post_id uuid references uslab_posts(id) on delete set null,
  about_id uuid references uslab_about(id) on delete set null,
  
  -- 페이지 경로(필수)
  page_path text not null,
  
  -- 언어(선택: /ko, /en 파싱 또는 클라 전달)
  locale text check (locale in ('ko', 'en')),
  
  -- 확장 컬럼(지금은 null 허용, Step 2+에서 활용)
  view_duration integer,  -- seconds
  scroll_depth integer,   -- 0-100
  
  created_at timestamptz not null default now()
);

-- 페이지뷰 인덱스 생성
create index if not exists uslab_idx_page_views_created_at on uslab_page_views (created_at desc);
create index if not exists uslab_idx_page_views_page_path_created_at on uslab_page_views (page_path, created_at desc);
create index if not exists uslab_idx_page_views_post_id_created_at on uslab_page_views (post_id, created_at desc);
create index if not exists uslab_idx_page_views_about_id_created_at on uslab_page_views (about_id, created_at desc);
create index if not exists uslab_idx_page_views_session_id_created_at on uslab_page_views (session_id, created_at desc);

-- Asia/Seoul 기준 일별 집계를 위한 함수 인덱스 (선택, 성능 최적화)
create index if not exists uslab_idx_page_views_created_at_kst_day 
  on uslab_page_views (date_trunc('day', created_at at time zone 'Asia/Seoul'));

-- RLS 활성화
alter table uslab_page_views enable row level security;

-- RLS 정책: Admin(authenticated)만 조회 가능
create policy if not exists uslab_policy_page_views_select_authenticated
  on uslab_page_views
  for select
  using (auth.role() = 'authenticated');

-- 주석 추가
comment on table uslab_page_views is 'USLab.ai 페이지뷰 추적 테이블';
comment on column uslab_page_views.page_path is '페이지 경로 (예: /ko/blog/ai-agent)';
comment on column uslab_page_views.locale is '페이지 언어: ko/en';
comment on column uslab_page_views.view_duration is '페이지 체류 시간 (초, Step 2+에서 활용)';
comment on column uslab_page_views.scroll_depth is '스크롤 깊이 (0-100%, Step 2+에서 활용)';

-- 3. Retention 정리 함수 (90일 지난 데이터 삭제)
create or replace function uslab_cleanup_old_tracking()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_pageviews integer;
  deleted_sessions integer;
begin
  -- 90일 지난 page_views 삭제
  delete from uslab_page_views
  where created_at < now() - interval '90 days';
  
  get diagnostics deleted_pageviews = row_count;
  
  -- orphan sessions 삭제 (90일 지났고 page_views가 없는 세션)
  delete from uslab_sessions s
  where s.created_at < now() - interval '90 days'
    and not exists (select 1 from uslab_page_views pv where pv.session_id = s.id);
  
  get diagnostics deleted_sessions = row_count;
  
  -- 삭제된 row 수 반환
  return deleted_pageviews + deleted_sessions;
end;
$$;

-- 함수 주석 추가
comment on function uslab_cleanup_old_tracking() is '90일 지난 트래킹 데이터를 삭제하는 함수. page_views와 orphan sessions를 정리합니다.';

-- 함수 실행 권한 부여 (service_role만, Vercel Cron에서 호출)
grant execute on function uslab_cleanup_old_tracking() to service_role;


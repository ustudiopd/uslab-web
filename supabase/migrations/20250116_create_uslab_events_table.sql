-- USLab Events 테이블 생성
-- 마이그레이션 날짜: 2025-01-16
-- 목적: 이벤트 추적 (클릭, 스크롤, 전환 등)을 위한 테이블
-- 
-- 주요 기능:
-- 1. 클릭 이벤트 추적 (히트맵용)
-- 2. 스크롤 깊이 추적
-- 3. 전환 이벤트 추적
-- 4. 페이지 참여도 추적
-- 
-- 보안:
-- - RLS 정책으로 authenticated 사용자만 조회 가능
-- - Insert는 /api/track에서 service role로 수행 (RLS 우회)

-- Events 테이블 (uslab_events)
create table if not exists uslab_events (
  id uuid primary key,  -- 클라이언트에서 생성한 UUID (중복 방지)
  session_id uuid not null references uslab_sessions(id) on delete cascade,
  page_view_id uuid references uslab_page_views(id) on delete set null,
  
  -- 이벤트 정보
  name varchar(100) not null,  -- click, scroll_depth, conversion, page_engagement, web_vital
  page_path text not null,
  
  -- 이벤트 속성 (JSONB)
  props jsonb default '{}'::jsonb,
  
  -- 타임스탬프
  client_ts bigint,  -- 클라이언트 타임스탬프 (밀리초, nullable)
  created_at timestamptz not null default now()
);

-- Events 인덱스 생성
create index if not exists uslab_idx_events_created_at on uslab_events (created_at desc);
create index if not exists uslab_idx_events_session_id on uslab_events (session_id, created_at desc);
create index if not exists uslab_idx_events_page_view_id on uslab_events (page_view_id, created_at desc);
create index if not exists uslab_idx_events_name on uslab_events (name, created_at desc);
create index if not exists uslab_idx_events_page_path on uslab_events (page_path, created_at desc);

-- props JSONB 인덱스 (히트맵 쿼리 최적화)
create index if not exists uslab_idx_events_props_click on uslab_events 
  using gin (props jsonb_path_ops) 
  where name = 'click';

-- RLS 활성화
alter table uslab_events enable row level security;

-- RLS 정책: Admin(authenticated)만 조회 가능
create policy uslab_policy_events_select_authenticated
  on uslab_events
  for select
  using (auth.role() = 'authenticated');

-- 주석 추가
comment on table uslab_events is 'USLab.ai 이벤트 추적 테이블 (클릭, 스크롤, 전환 등)';
comment on column uslab_events.id is '클라이언트에서 생성한 이벤트 ID (UUID, 중복 전송 방지)';
comment on column uslab_events.name is '이벤트 이름: click, scroll_depth, conversion, page_engagement, web_vital';
comment on column uslab_events.page_path is '이벤트가 발생한 페이지 경로';
comment on column uslab_events.props is '이벤트 속성 (JSONB): 클릭 좌표, 스크롤 깊이, 전환 정보 등';
comment on column uslab_events.client_ts is '클라이언트 타임스탬프 (밀리초, 클라이언트 시간 기준)';


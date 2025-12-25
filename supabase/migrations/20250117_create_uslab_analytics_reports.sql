-- USLab Analytics Reports 테이블 생성
-- 마이그레이션 날짜: 2025-01-17
-- 목적: AI 생성 분석 보고서 저장 및 캐싱
--
-- 주요 기능:
-- 1. AI 생성 보고서 저장
-- 2. 입력 해시 기반 캐싱 (같은 입력 = 같은 보고서 재사용)
-- 3. 멀티테넌트 지원 (site_prefix)
-- 4. 자동/수동 생성 구분 (created_via)
--
-- 보안:
-- - RLS 정책으로 authenticated 사용자만 조회 가능
-- - Insert는 /api/ai/analytics-report에서 service role로 수행 (RLS 우회)

-- Analytics Reports 테이블 (uslab_analytics_reports)
create table if not exists uslab_analytics_reports (
  id uuid primary key default gen_random_uuid(),
  
  -- 멀티테넌트 지원
  site_prefix varchar(50) not null,  -- uslab/ustudio/modu
  
  -- 보고서 메타 정보
  report_type varchar(20) not null,  -- daily/weekly/monthly/custom
  period_start date not null,
  period_end date not null,
  days integer not null,
  include_comparison boolean default false,
  
  -- 생성 정보
  prompt_version varchar(20) not null,  -- 프롬프트 버전 (예: "1.1")
  model_name varchar(50) not null,        -- gemini-2.0-flash 등
  report_json jsonb not null,            -- AIReport JSON
  
  -- 캐싱을 위한 입력 해시
  input_hash varchar(64) not null,       -- SHA-256 해시 (같은 입력 = 같은 해시)
  
  -- 생성 방식
  created_via varchar(20) not null,      -- manual/cron
  
  -- 타임스탬프
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists uslab_idx_reports_site_prefix on uslab_analytics_reports (site_prefix, generated_at desc);
create index if not exists uslab_idx_reports_type_period on uslab_analytics_reports (report_type, period_start, period_end);
create index if not exists uslab_idx_reports_input_hash on uslab_analytics_reports (input_hash);
create index if not exists uslab_idx_reports_created_via on uslab_analytics_reports (created_via, generated_at desc);

-- RLS 활성화
alter table uslab_analytics_reports enable row level security;

-- RLS 정책: Admin(authenticated)만 조회 가능
create policy uslab_policy_reports_select_authenticated
  on uslab_analytics_reports
  for select
  using (auth.role() = 'authenticated');

-- 주석 추가
comment on table uslab_analytics_reports is 'AI 생성 분석 보고서 저장 테이블';
comment on column uslab_analytics_reports.input_hash is '입력 데이터 해시 (캐싱용, SHA-256)';
comment on column uslab_analytics_reports.report_json is 'AIReport JSON 구조';
comment on column uslab_analytics_reports.site_prefix is '멀티테넌트 지원: uslab/ustudio/modu';
comment on column uslab_analytics_reports.created_via is '생성 방식: manual(수동) 또는 cron(자동)';


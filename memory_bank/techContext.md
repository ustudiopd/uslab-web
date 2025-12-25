# 기술 스택 정보 (Tech Context)

## 1. 프레임워크 및 라이브러리  
- **언어 및 버전**: 
  - TypeScript (최신)
  - Node.js v20.x
- **핵심 프레임워크**: 
  - Next.js 14 (App Router)
  - React 18+
- **데이터베이스**: 
  - Supabase (PostgreSQL 기반)
  - pgvector (벡터 검색용, 필요시)
- **상태 관리**: 
  - React Server Components (서버 컴포넌트)
  - 필요시 Zustand (클라이언트 상태)
- **UI 라이브러리**: 
  - Tailwind CSS
  - Lucide React (아이콘)
  - Framer Motion (애니메이션)
- **주요 라이브러리**: 
  - `@supabase/supabase-js` (Supabase 클라이언트)
  - `clsx`, `tailwind-merge` (스타일 유틸리티)
  - `novel` (블로그 에디터 - Novel.sh)
  - `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/core`, `@tiptap/html` (에디터 코어)
  - `@tailwindcss/typography` (블로그 본문 스타일링)
  - `ai` (Vercel AI SDK)
  - `@ai-sdk/google` (Google Gemini 통합)
- **다국어 지원 (i18n)**:
  - 커스텀 i18n 솔루션 (React Context API 기반)
  - 지원 언어: 한국어 (ko), 영어 (en)
  - 번역 파일: JSON 형식 (`lib/i18n/translations/`)
  - 언어 전환: 클라이언트 사이드 (localStorage 저장)
  - SSR 호환: 서버 사이드 렌더링 지원

## 1-1. Supabase 프로젝트 정보
- **⚠️ 중요: 프로젝트 구조**
  - **Supabase 프로젝트 이름**: **ustudio**
  - **프로젝트 ID**: `gzguucdzsrfypbkqlyku`
  - **프로젝트 공유 구조**: 하나의 Supabase 프로젝트(`ustudio`)에 **3개 웹사이트가 함께 사용됨**
    - `ustudio.co.kr` → `ustudio_` prefix 사용
    - `modoolucture` → `modu_` prefix 사용  
    - `uslab.ai` → `uslab_` prefix 사용
  - **⚠️ 주의**: uslab.ai는 독립적인 Supabase 프로젝트가 **아니며**, ustudio 프로젝트 내에서 prefix로 구분되는 하나의 웹사이트입니다.
- **스키마 분리 전략**: 
  - **테이블**: `uslab_` prefix 사용 (예: `uslab_projects`, `uslab_posts`, `uslab_comments`)
  - **함수**: `uslab_` prefix 사용 (예: `uslab_update_updated_at`)
  - **트리거**: `uslab_` prefix 사용
  - **RLS 정책**: `uslab_` prefix 사용
  - **인덱스**: `uslab_` prefix 사용
- **설정 방법**: MCP (Model Context Protocol)를 통한 설정
- **MCP 서버 설정** (Cursor 설정 파일: `C:\Users\Ustudio001\.cursor\mcp.json`):
  ```json
  {
    "mcpServers": {
      "supabase": {
        "type": "http",
        "url": "https://mcp.supabase.com/mcp?project_ref=gzguucdzsrfypbkqlyku&read_only=true"
      }
    }
  }
  ```
  - **연결 방식**: Supabase 공식 원격 MCP 서버 사용 (HTTP 방식)
  - **프로젝트 스코핑**: `project_ref=gzguucdzsrfypbkqlyku`로 특정 프로젝트만 접근
  - **읽기 전용 모드**: `read_only=true`로 쓰기 작업 방지 (보안 강화)
  - **인증**: Cursor가 자동으로 브라우저를 열어 Supabase 로그인 및 조직 접근 권한 승인 요청
  - **참고**: 환경 변수는 `.env.local` 파일에서 가져옴
  - **필수 환경 변수** (애플리케이션용):
    - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key (클라이언트용)
    - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (서버용, RLS 우회)

## 2. 개발 환경  
- **패키지 매니저**: npm (또는 yarn)
- **Linter / Formatter**: 
  - ESLint (Next.js 기본 설정)
  - Prettier (코드 포맷팅)
- **개발 도구**:
  - TypeScript
  - Git (버전 관리)

## 3. 배포 환경  
- **호스팅**: 
  - Frontend: Vercel (Pro 플랜)
  - Backend: Supabase
- **Vercel 설정**:
  - **플랜**: Pro (유료)
  - **Fluid Compute**: 활성화됨 (동시성 관리 및 성능 최적화)
  - **Function 타임아웃**: 60초 (기본값)
  - **성능 고려사항**:
    - 블로그 번역 기능 (`/api/ai/translate-post`) 소요 시간: 약 38초
    - 현재는 60초 제한 내에 있어 문제 없음
    - 향후 더 긴 처리 시간이 필요하거나 타임아웃 이슈 발생 시 Vercel Queue로 전환 고려
- **CI/CD**: 
  - Vercel 자동 배포 (Git 연동)
  - GitHub Actions (선택적)

## 4. 블로그 시스템
- **에디터**: Novel.sh (Tiptap 기반)
- **데이터베이스**: Supabase (`uslab_posts`, `uslab_post_versions`)
- **인증**: Supabase Auth (관리자 전용)
- **다국어 지원**: ko/en (locale 필드)
- **SEO**: seo_title, seo_description, seo_keywords 필드
- **조회수 추적**: 
  - `view_count` 컬럼 (INTEGER, 기본값 0)
  - `uslab_increment_view_count(UUID)` 함수 (원자적 증가, SECURITY DEFINER)
  - 발행된 포스트만 조회수 증가
  - API 엔드포인트: `/api/posts/[id]/view` (POST)
  - 프론트엔드 자동 증가 (PostViewer 컴포넌트)
- **AI 기능**: 
  - Gemini 2.0 Flash 모델 사용
  - AI Slug 생성 (`/api/ai/slug`) - 의미 기반 영문 slug 자동 생성
  - 환경 변수: `GOOGLE_API_KEY` (자동으로 `GOOGLE_GENERATIVE_AI_API_KEY`로 매핑)
- **상태**: Phase 1-2 완료 (에디터 통합, CRUD), Phase 3 일부 완료 (AI Slug 생성), Phase 3 진행 중 (AI 이어쓰기, 교정, SEO)

## 5. 통계 시스템 (Analytics)
- **트래킹 시스템**: 
  - Phase 0 완료: 이식성 확보 (ANALYTICS_PREFIX 환경변수, page_path 정규화, page_view_id 클라이언트 생성)
  - Step1 완료: 기본 트래킹 (세션 관리, Bot 필터링, 페이지뷰 추적)
  - Phase 1 완료: Events + 히트맵 (Events 테이블, 이벤트 수집, 히트맵 UI)
  - 단기 개선 완료: Retention 스케줄러, post_id/about_id 자동 매핑
- **데이터베이스 테이블**:
  - `uslab_sessions`: 세션 추적 (session_key, landing_path, referrer, UTM, device_type)
  - `uslab_page_views`: 페이지뷰 추적 (session_id, post_id, about_id, page_path, locale)
  - `uslab_events`: 이벤트 추적 (session_id, page_view_id, name, page_path, props JSONB)
- **Rollup 테이블 (옵션, 미구현)**:
  - 목적: 대시보드 조회 성능 최적화
  - 개념: 원본(raw) 데이터를 미리 집계하여 저장하는 테이블
  - 필요 시점: 트래픽이 많아져서 대시보드가 느려질 때 고려
  - 예정 테이블:
    - `uslab_daily_stats`: 일별 통계 집계 (pageviews, uniques)
    - `uslab_daily_page_stats`: 페이지별 일별 통계 집계
    - `uslab_heatmap_element_daily`: 히트맵 요소별 일별 집계
  - 생성 방식: 매일 자정에 Vercel Cron으로 전날 데이터 집계
  - 조회 전략: rollup 우선 조회, 없으면 raw 데이터로 fallback
  - 현재 상태: 미구현 (트래픽 증가 시 옵션으로 고려 가능)
  - 참고 문서: `docs/대시보드_통계_기능_구현_검토보고서.md`, `통계시스템.md`


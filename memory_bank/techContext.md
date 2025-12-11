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
- **다국어 지원 (i18n)**:
  - 커스텀 i18n 솔루션 (React Context API 기반)
  - 지원 언어: 한국어 (ko), 영어 (en)
  - 번역 파일: JSON 형식 (`lib/i18n/translations/`)
  - 언어 전환: 클라이언트 사이드 (localStorage 저장)
  - SSR 호환: 서버 사이드 렌더링 지원

## 1-1. Supabase 프로젝트 정보
- **프로젝트 이름**: ustudio (ustudio와 uslab 공유)
- **프로젝트 ID**: gzguucdzsrfypbkqlyku
- **스키마 분리 전략**: 
  - **테이블**: `uslab_` prefix 사용 (예: `uslab_projects`, `uslab_posts`)
  - **함수**: `uslab_` prefix 사용 (예: `uslab_update_updated_at`)
  - **트리거**: `uslab_` prefix 사용
  - **RLS 정책**: `uslab_` prefix 사용
  - **인덱스**: `uslab_` prefix 사용
- **설정 방법**: MCP (Model Context Protocol)를 통한 설정

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
  - Frontend: Vercel
  - Backend: Supabase
- **CI/CD**: 
  - Vercel 자동 배포 (Git 연동)
  - GitHub Actions (선택적)

## 4. 블로그 시스템
- **에디터**: Novel.sh (Tiptap 기반)
- **데이터베이스**: Supabase (`uslab_posts`, `uslab_post_versions`)
- **인증**: Supabase Auth (관리자 전용)
- **다국어 지원**: ko/en (locale 필드)
- **SEO**: seo_title, seo_description, seo_keywords 필드
- **상태**: Phase 1-2 완료 (에디터 통합, CRUD), Phase 3 대기 (AI 기능)


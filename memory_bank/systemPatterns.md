# 시스템 아키텍처 및 패턴 (System Patterns)

## 1. 전체 아키텍처  
- **아키텍처 유형**: 3-Tier Architecture + Serverless Functions
- **레이어 구조**:
  1. **Client Layer**: 사용자 인터페이스 (Next.js Frontend)
  2. **Application Layer**: 비즈니스 로직 (Next.js API Routes)
  3. **Data Layer**: 데이터 저장소 (Supabase PostgreSQL)
- **다중 프로젝트 스키마 분리**:
  - **ustudio**: `ustudio_` prefix 사용 (ustudio.co.kr)
  - **uslab**: `uslab_` prefix 사용 (uslab.ai)
  - 같은 Supabase 프로젝트 내에서 prefix로 완전 분리
- **배포 환경**: 
  - Frontend: Vercel (별도 배포)
  - Backend: Supabase (공유)

## 2. 주요 디자인 패턴  
- **Component-Based Architecture**: React/Next.js 컴포넌트 기반 개발
- **API Route Pattern**: Next.js API Routes를 통한 서버리스 함수 구현
- **Repository Pattern**: Supabase 클라이언트를 통한 데이터 접근 추상화
- **Schema Separation Pattern**: Prefix 기반 다중 프로젝트 스키마 분리
- **Observer Pattern**: 실시간 데이터 업데이트 (Supabase Realtime, 필요시)
- **Internationalization (i18n) Pattern**: 
  - React Context API 기반 언어 상태 관리
  - JSON 기반 번역 파일 구조
  - 클라이언트 사이드 언어 전환 (SSR 호환)
  - localStorage를 통한 언어 선택 영구 저장
  - 브라우저 언어 자동 감지

## 3. 코딩 컨벤션  
- **TypeScript**: 
  - 변수/함수: `camelCase`
  - 클래스/컴포넌트: `PascalCase`
  - 상수: `UPPER_SNAKE_CASE`
  - 타입/인터페이스: `PascalCase` (접두사 `I` 사용 지양)
- **데이터베이스 네이밍**:
  - 테이블: `uslab_[table_name]` (예: `uslab_projects`)
  - 함수: `uslab_[function_name]` (예: `uslab_update_updated_at`)
  - 트리거: `uslab_[trigger_name]`
  - RLS 정책: `uslab_[policy_name]`
  - 인덱스: `uslab_[index_name]`
- **파일 구조**:
  - 컴포넌트: `components/ComponentName.tsx`
  - 페이지: `app/[route]/page.tsx`
  - API: `app/api/[route]/route.ts`
  - 유틸리티: `lib/utils.ts`
  - Supabase: `lib/supabase/`
  - 쿼리: `lib/queries/`
  - i18n: `lib/i18n/`
    - `config.ts`: 언어 설정 및 타입
    - `context.tsx`: LanguageContext 및 Provider
    - `hooks.ts`: 편의용 훅
    - `translations/`: 번역 파일 (ko.json, en.json)
- **네이밍 규칙**:
  - Boolean 변수: `is`, `has`, `should` 접두사 사용
  - 이벤트 핸들러: `handle` 접두사 사용 (예: `handleSubmit`)
  - API 함수: 동사 사용 (예: `getProjects`, `createPost`)


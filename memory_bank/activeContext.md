# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: 라이트 테마 전환 및 UI/UX 개선
- **목표**: 다크 테마에서 라이트 테마로 전환, UI 요소 최적화
- **담당자**: AI Assistant + 사용자
- **상태**: ✅ 라이트 테마 전환 완료, ✅ UI 요소 최적화 완료

## 2. 최근 완료된 작업
### [2025-01-XX] 라이트 테마 전환 및 UI/UX 개선
- ✅ **다크 테마 → 라이트 테마 전환**
  - `lib/hooks/useTheme.ts`: 라이트 테마를 기본값으로 설정 (다크 테마 코드는 주석으로 보존)
  - `app/layout.tsx`: HTML의 `dark` 클래스 제거, 스크립트 수정
  - `app/globals.css`: body 기본 스타일을 라이트 테마로 변경
  - `tailwind.config.ts`: grid-pattern을 라이트 테마에 맞게 조정
  - 모든 섹션 컴포넌트에 라이트 테마 클래스 추가 (Hero, Services, Portfolio, Philosophy, Contact, Logos)
  - 색상 대비 개선: 텍스트 색상 강화 (`text-slate-600` → `text-slate-700/800`), 보더 색상 강화
- ✅ **Hero 섹션 최적화**
  - 로고 아이콘들 제거 (Python, AWS, Google, Microchip, Database)
  - "지금 시작하기", "포트폴리오 보기" 버튼 제거
  - 로고 이미지 제거
  - 색상 톤 추가 (`bg-gradient-to-b from-cyan-50/40 via-blue-50/30 to-white`)
- ✅ **Logos 섹션 제거**
  - `app/[lang]/page.tsx`에서 Logos 컴포넌트 제거
- ✅ **섹션 설명 텍스트 제거**
  - Philosophy 섹션 설명 텍스트 제거
  - Services 섹션 설명 텍스트 제거
- ✅ **Services 카드 색상 톤 개선**
  - 기본적으로 색상 적용 (그라데이션 배경 50% 투명도)
  - 호버 시 효과만 강화 (75% 투명도, 보더 진하게, 아이콘 확대)
- ✅ **Navbar 개선**
  - US 아이콘 박스 제거
  - 로고 텍스트 변경: "USLab.ai" → "USLab AI" (AI는 cyan 색상)
  - 문의하기 버튼 텍스트 색상 개선
- ✅ **Footer 개선**
  - 개인정보처리방침 및 이용약관 제거
  - 패밀리 사이트 섹션 추가 (U-Studio, Modoolecture)
  - 패밀리 사이트 가로 배치
  - US 아이콘 박스 제거, "USLab AI" 텍스트로 변경
- ✅ **블로그 UI 개선**
  - 포스트 카드 제목 색상 개선 (`text-slate-900` → `text-slate-950`)
  - 뷰 모드 전환 버튼 배경 색상 개선 (선택되지 않은 버튼: `bg-white`)
- ✅ **번역 파일 업데이트**
  - "USLab.ai" → "USLab AI"로 전체 변경 (ko.json, en.json)
  - 패밀리 사이트 번역 추가

### [2025-12-14]
- ✅ **메인페이지 UI/UX 개선**
  - Hero 섹션에서 "지금 시작하기" 버튼 제거
  - Navbar 모바일 메뉴에서 "문의하기" 버튼 제거
  - Hero 섹션 제목 두 줄 간격 조정 (`mt-2 sm:mt-3 md:mt-4`)
- ✅ **Logos 섹션 독립화**
  - Hero와 Philosophy 사이에 별도의 Logos 섹션 생성 (`components/sections/Logos.tsx`)
  - 로고 이미지 교체 (logo3.png → logo5.png → logo6.png)
  - 위아래 마진 100px 설정 (`py-[100px]`)
  - 다른 섹션과 동일한 템플릿 패턴 적용 (`max-w-7xl`, `px-4 sm:px-6 lg:px-8`)
  - 원본 이미지 크기로 표시 (`unoptimized`, `w-auto h-auto`)
- ✅ **Portfolio 섹션 호버 효과 추가**
  - 호버 시 border 색상 변경 (`hover:border-slate-600`)
  - 이미지 확대 효과 (`group-hover:scale-105`)
  - 제목 색상 변경 (`group-hover:text-${color}-400`)
  - 전환 효과 (`transition-all`, `transition-transform`)
- ✅ **어드민 대시보드 및 트래킹 시스템 구현 (Step 1 MVP)**
  - 트래킹 테이블 마이그레이션 (`uslab_sessions`, `uslab_page_views`)
  - Bot 필터링 및 Retention 정책 (90일)
  - `/api/track` API 엔드포인트 (sendBeacon 지원)
  - Tracker 컴포넌트 (세션 관리, UTM/Referrer 파싱)
  - Analytics 쿼리 함수 (오늘/7일/30일 통계)
  - `/admin/dashboard` 페이지 (KPI 카드, Top 데이터, 최근 활동)
  - 로그인 후 대시보드로 리다이렉트

### [2024-12-20]
- ✅ Plan/Act 워크플로우 초기화
- ✅ 메모리 뱅크 문서 업데이트 (projectbrief, techContext, systemPatterns)
- ✅ 스키마 분리 전략 수립 (`uslab_` prefix 기반)
- ✅ Next.js 14 웹사이트 구축 완료
  - HTML을 Next.js App Router로 완전 변환
  - 모든 섹션 컴포넌트 생성 (Hero, Philosophy, Services, Portfolio, Contact)
  - Supabase 연동 (문의 폼)
  - 반응형 디자인 구현
- ✅ 타입 오류 수정 및 빌드 테스트 성공
- ✅ GitHub 리포지토리 생성 및 초기 푸시 완료
- ✅ Vercel 자동 배포 설정 완료
- ✅ **다국어 지원 (KOR/ENG) 구현 완료**
  - i18n 인프라 구축 (Context API 기반)
  - 모든 컴포넌트 번역 적용
  - 언어 전환 기능 구현
  - localStorage 기반 언어 선택 저장
  - 에러 경계 컴포넌트 추가

### [2025-01-01]
- ✅ **블로그 에디터 시스템 Phase 1-2 완료**
  - Supabase 마이그레이션 파일 생성 (`uslab_posts`, `uslab_post_versions`)
  - Novel.sh 에디터 통합 (기본 버전)
  - 포스트 CRUD 기능 구현 (생성, 조회, 수정, 삭제)
  - 관리자 페이지 구현 (목록, 작성, 수정)
  - 인증 시스템 통합 (useAuth 훅)
  - 다국어 지원 (ko/en)
  - SEO 필드 구조 준비 (seo_title, seo_description, seo_keywords)
- ✅ **블로그 에디터 시스템 Phase 3 일부 완료**
  - AI 패키지 설치 (`ai`, `@ai-sdk/google`)
  - AI Slug 생성 API 구현 (`/api/ai/slug`)
    - Gemini 2.0 Flash 모델 사용
    - 의미 기반 영문 slug 자동 생성 (SEO 최적화)
    - 제목 입력 시 자동 생성 또는 수동 생성 버튼
  - 환경 변수 매핑: `GOOGLE_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` 자동 변환
- ✅ **UI/UX 개선**
  - 편집 페이지에 "취소" 및 "목록으로 돌아가기" 버튼 추가
  - 작성 페이지에 "취소" 및 "목록으로 돌아가기" 버튼 추가
  - 취소 버튼: 변경사항을 원본 데이터로 되돌리기 기능
  - 모바일 버전 최적화 (관리자 페이지)

### [2025-01-12]
- ✅ **메인페이지 레이아웃 최적화**
  - 제목 두 줄 분리 (모바일 최적화)
    - Portfolio: "결과로 증명하는" / "USlab.ai의 전문성"
    - Services: "당신의 성공을 위한" / "3가지 솔루션"
    - Philosophy: "무엇이 USlab.ai를" / "특별하게 만드는가?"
  - 그라디언트 효과 적용 (Tailwind `bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent`)
  - 한글 텍스트 줄바꿈 개선
    - `korean-text` CSS 클래스 추가 (`app/globals.css`)
    - Contact 섹션 설명 텍스트에 적용
    - `word-break: keep-all`로 단어 중간에 잘리지 않도록 개선

### [2025-01-02]
- ✅ **블로그 댓글 시스템 구현 완료**
  - `uslab_comments` 테이블 마이그레이션 적용 (ustudio 프로젝트에 생성)
  - 댓글 API 라우트 구현 (GET, POST, PATCH, DELETE)
  - 댓글 UI 컴포넌트 통합
  - 비밀번호 기반 댓글 수정/삭제 기능
- ✅ **프로젝트 구조 명확화**
  - ⚠️ 중요: uslab.ai는 ustudio 프로젝트(`gzguucdzsrfypbkqlyku`) 내에서 prefix로 구분되는 하나의 웹사이트입니다.
  - ustudio 프로젝트에 3개 웹사이트가 함께 사용됨 (ustudio, modoolucture, uslab)

### [2025-01-15]
- ✅ **소개 페이지 시스템 구현 완료**
  - 소개 페이지 CRUD 기능 구현 (`/[lang]/about` 라우트)
  - 관리자 인터페이스 구현 (`/admin/about`)
  - KO/EN 버전 탭 및 자동 번역 기능
  - 조회수 추적 및 표시 (관리자만)
  - YouTube 임베딩 기능 (16:9 비율)
- ✅ **Hydration Mismatch 해결**
  - 서버 사이드 HTML 생성 유틸리티 함수 생성 (`lib/utils/generate-html.ts`)
  - 서버 컴포넌트에서 HTML 생성 후 클라이언트로 전달
  - 클라이언트 DOM 조작 시점 제어 (`mounted` 상태)

### [2025-01-16]
- ✅ **소개 페이지 SEO 기능 추가**
  - `uslab_about` 테이블에 SEO 필드 추가 마이그레이션 (`seo_title`, `seo_description`, `seo_keywords`)
  - `generateMetadata` 함수 업데이트 (동적 SEO 메타데이터 생성)
  - OpenGraph 및 Twitter Card 메타데이터 지원
  - JSON-LD 구조화된 데이터 추가 (AboutPage, BreadcrumbList, Organization)
  - hreflang 및 canonical URL 설정
  - 관리자 페이지 저장 시 AI SEO 자동 생성 기능 통합 (`/api/ai/seo`)
  - 블로그와 동일한 SEO 자동 생성 워크플로우 적용
- ✅ **모바일 레이아웃 전체 개선**
  - AdminLayout 모바일 최적화 (세로 레이아웃, 탭/사용자 정보 분리)
  - 소개 페이지 모바일 최적화 (패딩, 폰트 크기 조정)
  - 관리자 페이지 모바일 최적화 (버튼 크기, 레이아웃 개선)
  - 포스트 작성/수정 페이지 모바일 최적화
  - AboutVersionTabs, PostVersionTabs 모바일 최적화
  - TranslateActions, TranslateAboutActions 모바일 최적화
  - scrollbar-hide 유틸리티 클래스 추가

## 3. 다음 예정 작업  
### Phase 3: AI 기능 통합 (블로그에디터.md 참고)
- ✅ **AI 패키지 설치** (완료)
  - `ai` 패키지 (Vercel AI SDK)
  - `@ai-sdk/google` 패키지 (Gemini 통합)
- ✅ **AI Slug 생성** (완료)
  - `/api/ai/slug`: 의미 기반 영문 slug 자동 생성
- **AI API 엔드포인트 구현** (진행 중)
  - `/api/ai/generate`: AI 이어쓰기 (Streaming)
  - `/api/ai/refine`: 문단별 AI 교정
  - `/api/ai/seo`: SEO 메타데이터 자동 생성
- **AI Copilot UI 구현**
  - 문단 선택 시 AI 수정 버튼
  - DiffView 컴포넌트 (원본/제안 비교)
- **발행 프로세스 개선**
  - 발행 시 SEO 자동 생성 통합
  - 비동기 SEO 생성 (선택적)

### 기타 작업
- **Supabase 마이그레이션 적용**
  - `uslab_blog_tables` 마이그레이션 적용 확인
  - RLS 정책 검증
- **배포 후 검증**
  - Vercel 배포 확인
  - 블로그 기능 동작 테스트

## 4. 주요 이슈 및 블로커  
- 현재 블로커 없음
- 스키마 분리 전략 확정: `uslab_` prefix 사용 (ustudio의 `ustudio_` 패턴과 동일)
- ⚠️ **중요: Supabase 프로젝트 구조**
  - Supabase 프로젝트 ID: `gzguucdzsrfypbkqlyku` (프로젝트 이름: **ustudio**)
  - 하나의 Supabase 프로젝트에 3개 웹사이트가 함께 사용됨:
    - `ustudio.co.kr` → `ustudio_` prefix
    - `modoolucture` → `modu_` prefix
    - `uslab.ai` → `uslab_` prefix
  - **⚠️ 주의**: uslab.ai는 독립적인 Supabase 프로젝트가 **아니며**, ustudio 프로젝트 내에서 prefix로 구분되는 하나의 웹사이트입니다.
- ⚠️ **성능 고려사항: 블로그 번역 기능**
  - **현재 상태**: KO/EN 자동 번역 기능 구현 완료 (`/api/ai/translate-post`)
  - **실제 소요 시간**: 약 38초 (테스트 결과)
  - **배포 환경**: Vercel Pro + Fluid Compute 활성화
    - Vercel Pro 기본 타임아웃: 60초
    - Fluid Compute: 동시성 관리 및 성능 최적화 활성화
    - 현재 38초는 60초 제한 내에 있어 기술적으로 문제 없음
  - **향후 개선 방안** (문제 발생 시):
    - Vercel Queue로 전환하여 백그라운드 처리
    - 즉시 응답 반환 + 작업 ID로 진행 상태 추적
    - 타임아웃 걱정 없이 안정적인 처리
    - 실패 시 자동 재시도 기능
  - **현재 결정**: 문제 발생 시 Queue로 전환 예정


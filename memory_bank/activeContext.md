# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: 성능 최적화 및 UX 개선
- **목표**: CLS 개선, 히트맵 기능 구현, 블로그 포스트 가독성 개선
- **담당자**: AI Assistant + 사용자
- **상태**: ✅ 히트맵 구현 완료, ✅ 코드 블록 라이트 테마 개선 완료, ✅ CLS 개선 방안 P0 적용 완료

## 2. 최근 완료된 작업
### [2025-01-25] CLS 개선 방안 P0 적용 완료
- ✅ **이미지 width/height 속성 동적 적용**
  - `components/blog/PostViewer.tsx`: 이미지 로드 완료 후 실제 크기 측정 및 width/height 속성 설정
  - `MutationObserver`로 동적 추가 이미지도 처리
  - `loading: 'lazy'`, `decoding: 'async'` 속성 추가
  - 예상 효과: CLS 50-70% 감소
- ✅ **YouTube iframe 초기 크기 명시**
  - `components/blog/PostViewer.tsx`: YouTube extension 설정 변경
  - `width: 560, height: 315` (표준 YouTube iframe 크기)
  - `min-height: 315px` CSS 속성 추가
  - 예상 효과: CLS 5-10% 감소
- ✅ **폰트 로딩 최적화**
  - `app/layout.tsx`: `display: 'swap'` → `display: 'optional'` 변경
  - Noto Sans KR, JetBrains Mono 모두 적용
  - FOUT 방지로 텍스트 크기 변경 최소화
  - 예상 효과: CLS 10-20% 감소
- ✅ **CLS 개선 방안 문서 작성**
  - `docs/CLS_개선_방안.md`: 문제 분석 및 개선 방안 정리
  - 현재 CLS 값 분석 (P75: 0.437, Poor 비율 43.2%)
  - 주요 원인 분석 (이미지, 폰트, YouTube iframe, 동적 콘텐츠)
  - P0/P1 우선순위별 개선 방안 제시

### [2025-01-25] 히트맵 기능 구현 완료
- ✅ **히트맵 데이터 수집**
  - `components/analytics/Tracker.tsx`: 클릭 이벤트 리스너 등록
  - `lib/utils/eventTracker.ts`: 클릭 좌표 정규화 (0~1) 및 이벤트 큐에 추가
  - `app/api/track/route.ts`: 클릭 이벤트를 `uslab_events` 테이블에 저장
  - 좌표 정규화: `x = clientX / viewportW`, `y = clientY / viewportH`
- ✅ **히트맵 API 엔드포인트**
  - `app/api/admin/heatmap/[pagePath]/route.ts`: 히트맵 데이터 조회 API
  - 클릭 이벤트를 20×20 그리드로 집계
  - 관리자 인증 필수
- ✅ **히트맵 시각화 컴포넌트**
  - `components/admin/HeatmapOverlay.tsx`: Canvas 기반 히트맵 렌더링
  - 전체 문서 크기 추적 및 스크롤 대응
  - 색상 그라데이션 (파란색 → 녹색 → 노란색 → 빨간색)
  - 복사 버튼 라이트 테마 최적화
- ✅ **히트맵 뷰어 통합**
  - `components/admin/HeatmapViewer.tsx`: 히트맵 모드 활성화 컴포넌트
  - `app/[lang]/page.tsx`: `?heatmap=true` 쿼리 파라미터로 히트맵 표시
  - `app/admin/dashboard/page.tsx`: "메인페이지 히트맵 보기" 버튼 추가
- ✅ **히트맵 구현 방식 문서 작성**
  - `docs/히트맵_구현_방식_보고서.md`: 전체 구현 방식 상세 설명
  - `docs/히트맵_검토_분석_보고서.md`: 검토 문서 분석 및 개선 방안 제시
  - 외부 라이브러리 없이 순수 Canvas API 사용
  - 데이터 수집부터 시각화까지 전체 플로우 문서화

### [2025-01-25] 블로그 포스트 코드 블록 가독성 개선
- ✅ **코드 블록 라이트 테마 개선**
  - `components/blog/PostViewer.tsx`: 코드 블록 배경색 및 텍스트 색상 개선
  - 라이트 모드: `bg-slate-50` (밝은 배경), `text-slate-900` (어두운 텍스트)
  - 다크 모드: 기존 스타일 유지 (`bg-slate-900`, `text-slate-100`)
- ✅ **줄별 하이라이트 배경색 제거**
  - 코드 블록 내부의 모든 하위 요소 배경색 제거
  - JavaScript로 동적 제거 + CSS로 정적 제거 (`[&_pre_code_*]:bg-transparent`)
  - 가독성 향상
- ✅ **복사 버튼 라이트 테마 최적화**
  - 라이트 모드: `bg-white/90` (흰색 배경), `text-slate-700` (어두운 텍스트)
  - 다크 모드: 기존 스타일 유지

### [2025-01-25] AI 분석 보고서 댓글 기능 추가
- ✅ **댓글 시스템 구현 완료**
  - `supabase/migrations/20250125_create_uslab_analytics_report_comments.sql`: 댓글 테이블 마이그레이션 생성 및 MCP로 적용 완료
  - `uslab_analytics_report_comments` 테이블 생성 (report_id, user_id, user_email, author_name, content)
  - RLS 정책 설정 (인증된 사용자만 조회/작성, 작성자만 수정/삭제)
  - 인덱스 및 트리거 생성 (updated_at 자동 업데이트)
- ✅ **댓글 API 엔드포인트 구현**
  - `app/api/admin/analytics-reports/[id]/comments/route.ts`: 댓글 목록 조회 (GET), 댓글 작성 (POST)
  - `app/api/admin/analytics-reports/[id]/comments/[commentId]/route.ts`: 댓글 수정 (PUT), 댓글 삭제 (DELETE)
  - 인증 기반 접근 제어 (관리자만 작성 가능)
  - 작성자만 자신의 댓글 수정/삭제 가능
- ✅ **댓글 UI 기능 추가**
  - `app/admin/dashboard/page.tsx`: 보고서 모달에 댓글 섹션 추가
  - 댓글 목록 표시 (작성자, 작성일시, 내용, 수정 여부)
  - 댓글 작성 기능 (텍스트 영역 + 작성 버튼)
  - 본인 댓글 수정/삭제 기능 (수정 모드, 삭제 확인)
  - 실시간 댓글 업데이트 (작성/수정/삭제 후 목록 갱신)
  - 보고서 로드 시 자동으로 댓글 가져오기

### [2025-01-25] AI 분석 보고서 검토의견 반영 (P0, P1 완료)
- ✅ **P0: 기간 규칙 정의 확정**
  - `app/api/ai/analytics-report/route.ts`: "완료된 캘린더 N일" 기준으로 변경
  - `end = 어제 23:59:59.999 (KST)`, `start = end - (N-1)일`
  - 이전 기간 비교도 동일 규칙 적용
- ✅ **P0: KST 표기 적용**
  - `lib/utils/dateFormatter.ts`: KST 날짜 포맷팅 유틸리티 함수 생성
  - 보고서 모달에 KST 날짜 범위 표시
  - 마크다운 내보내기에 KST 날짜 포맷 적용
- ✅ **P0: 비교표 코드 생성 및 삽입**
  - 보고서 모달에 비교표 추가 (이전/현재/변화/변화율)
  - 마크다운 내보내기에 비교표 포함
  - 이전 기간 날짜 정보 표시
- ✅ **P0: CLS 값 파이프라인 검증**
  - CLS 기준선 표기 추가 (목표: ≤0.1)
  - 비정상적으로 높은 값(>0.25) 경고 표시
  - P50/P75/P95 값 색상 구분 (0.1 초과 시 빨간색)
- ✅ **P1: 프롬프트 인젝션 방어 강화**
  - 시스템 프롬프트에 보안 규칙 6개 추가
  - "프롬프트 인젝션 방어" 명시
  - 데이터 내 텍스트가 지시사항이 아님을 강조
  - 악의적 입력 무시 규칙 추가
- ✅ **P1: 마크다운 변환 개선**
  - 모든 섹션 포함: 트렌드 분석, 성능 분석(Web Vitals, 참여도), SEO 분석
  - Web Vitals 표에 기준선 및 권장사항 포함
  - 구조화된 마크다운 형식으로 출력
- ✅ **검토의견 통합 분석 문서 작성**
  - `docs/AI_보고서_검토의견_통합분석.md`: 기존 검토의견과 GPT 검토 결과 통합 분석
  - 일치하는 핵심 문제점 정리
  - GPT 추가 지적 사항 정리
  - 현재 구현 상태 비교
  - 우선순위별 개선 작업 정리

### [2025-12-25] AI 분석 보고서 시스템 개선
- ✅ **인기포스트 데이터 표시 문제 해결**
  - `lib/queries/analytics.ts`: `getTopPosts` 함수 개선
    - `post_id`가 없어도 `page_path`에서 slug 추출하여 포스트 매핑
    - 쿼리 파라미터가 포함된 경로도 처리 (`?fbclid=...` 등)
    - 페이지네이션으로 모든 데이터 가져오기 (Supabase 1000행 제한 해결)
    - 한국 시간 기준 날짜 계산 적용
- ✅ **AI 보고서 저장 목록 표시 개선**
  - `app/admin/dashboard/page.tsx`: "AI 보고서" 섹션 항상 표시
    - `savedReports.length > 0` 조건 제거하여 보고서가 없어도 섹션 표시
    - 로딩 상태 및 빈 상태 처리 추가
    - "전체 보기" 버튼 항상 표시
- ✅ **AI 보고서 자동 저장 기능 확인 및 마이그레이션 적용**
  - `supabase/migrations/20250117_create_uslab_analytics_reports.sql`: 마이그레이션 파일 생성
  - MCP를 통해 마이그레이션 적용 완료
  - `uslab_analytics_reports` 테이블 생성 확인
  - 보고서 생성 시 자동 저장 기능 정상 작동 확인
- ✅ **이전 기간 대비 비교 데이터 개선**
  - `app/admin/dashboard/page.tsx`: `generateReport`에서 `includeComparison: true` 기본값 설정
  - `app/api/ai/analytics-report/route.ts`: 이전 기간 데이터 계산 로직 추가
    - 이전 기간 통계 계산 (`previousPeriodStats`)
    - 현재 기간과 이전 기간 데이터를 AI 입력에 포함
  - `lib/utils/reportFormatter.ts`: 이전 기간 데이터를 AI 입력에 상세히 포함
    - `previousPeriodData` 객체 생성 및 AI 입력에 추가
- ✅ **기본 기간 변경 (30일 → 7일)**
  - `app/admin/dashboard/page.tsx`: `selectedDays` 기본값 7일로 변경
  - 초기 로드 시 7일 데이터 표시
  - `app/api/ai/analytics-report/route.ts`: 기본값 7일로 변경
- ✅ **AI 보고서 개선사항 검토 문서 작성**
  - `docs/AI_보고서_개선사항_검토.md`: 보고서 분석 및 개선사항 정리
    - 날짜 표시 형식 문제 (UTC → 한국 시간)
    - 기간 계산 오류 ("8일간" → "7일간")
    - 이전 기간 비교 데이터 부족
    - 비교 데이터 표 형식 추가 제안
    - CLS 값 해석 개선 제안
    - 보고서 구조 개선 제안

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
- ✅ **어드민 페이지 라이트 테마 전환**
  - AdminLayout, 로그인, 대시보드, 포스트 관리, 소개 페이지, 운영진 보드 전체 라이트 테마로 변경
  - 블로그 에디터 및 버블 메뉴 라이트 테마로 변경
  - 포스트 작성/편집 페이지 라이트 테마로 변경
  - 소개 페이지 에디터 라이트 테마로 변경
  - 버전 탭 컴포넌트 (PostVersionTabs, AboutVersionTabs) 라이트 테마로 변경
  - 모든 다크 테마 색상 (bg-slate-900, text-white 등) → 라이트 테마 색상 (bg-white, text-slate-900 등)으로 변경
  - cyan 색상 → blue 색상으로 통일 (bg-cyan-500 → bg-blue-600)
  - 포스트 관리 페이지 배경 라이트 테마 적용 (min-h-screen bg-slate-50)

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
### 통계 시스템 개선 (옵션)
- **Phase 2: Rollup 테이블 도입** (트래픽 증가 시 고려)
  - 목적: 대시보드 조회 성능 최적화
  - Rollup 테이블: 원본(raw) 데이터를 미리 집계하여 저장하는 테이블
  - 필요 시점: 트래픽이 많아져서 대시보드가 느려질 때
  - 구현 내용:
    - `uslab_daily_stats`: 일별 통계 집계
    - `uslab_daily_page_stats`: 페이지별 일별 통계 집계
    - `uslab_heatmap_element_daily`: 히트맵 요소별 일별 집계
    - Rollup 생성 스케줄러 (매일 자정 실행)
    - Query 함수를 rollup 우선으로 변경
  - 현재 상태: 미구현 (옵션으로 고려 가능)
  - 참고: `docs/대시보드_통계_기능_구현_검토보고서.md` 참조

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


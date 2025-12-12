# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: 블로그 에디터 시스템 구현 (Phase 1-2 완료, Phase 3 진행 중)
- **목표**: Novel.sh 에디터 기반 블로그 시스템 구축, AI 기능 통합
- **담당자**: AI Assistant + 사용자
- **상태**: ✅ Phase 1-2 완료 (에디터 통합, CRUD 기능), ✅ Phase 3 일부 완료 (AI Slug 생성), ⏳ Phase 3 진행 중 (AI 이어쓰기, 교정, SEO)

## 2. 최근 완료된 작업
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
- Supabase 프로젝트 공유 확인: gzguucdzsrfypbkqlyku


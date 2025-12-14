아래 문서는 **USLab.ai 어드민(게시물 관리) + 통합 대시보드 + Lite 트래킹 + SEO(메타/기술 SEO)**를 **한 번에 Cursor(또는 팀/미래의 나)에게 던질 수 있는 “통합 명세서”** 형태로 재정리한 것입니다.
기존 v1.0 명세서(2025-01-15) 기반으로 구성하되 , **현재 구현 완료된 Step 1 MVP 범위와 남은 미구현 항목**까지 반영했습니다  .

---

# USLab.ai 어드민 · 대시보드 · 트래킹 · SEO 통합 명세서 (v1.1)

## 0. 문서 목적

* USLab.ai 운영에 필요한 **콘텐츠 관리(블로그/소개/댓글/문의/가비지 이미지)**를 어드민에서 처리
* **통합 대시보드(/admin/dashboard)**로 운영 지표를 한 화면에서 확인
* **Lite 자체 트래킹**으로 “오늘/7일/30일” 유입 및 Top 데이터를 확인
* Next.js 기본 기능으로 **기술적 SEO( sitemap/robots/canonical/JSON-LD )**를 갖추고, 포스트 단위 **SEO 품질(메타 누락 등)**을 관리

---

## 1. 프로젝트 제약/전제

### 1.1 기술 스택(고정)

* Next.js 14 (App Router), TypeScript, Tailwind CSS 
* 배포: Vercel Pro  (함수 타임아웃 60초 등 운영 제약 존재 )
* DB: Supabase(Postgres)

### 1.2 Supabase 공유 프로젝트 구조(중요)

USLab.ai는 **독립 Supabase 프로젝트가 아니라**, `ustudio` Supabase 프로젝트 내에서 **prefix로 분리 운영**합니다. 
따라서 **테이블/함수/트리거/인덱스/RLS 정책 모두 `uslab_` prefix**를 사용합니다. 

---

## 2. 구현 상태 요약(현재 기준)

### 2.1 ✅ 완료(“Step 1 MVP”)

* 트래킹 Lite MVP

  * `uslab_sessions`, `uslab_page_views` 마이그레이션
  * UA 기반 Bot 필터링
  * 90일 Retention 삭제 함수
  * `/api/track` (sendBeacon 지원)
  * Tracker 컴포넌트(세션 관리, UTM/Referrer 파싱)
  * 오늘/7일/30일 + Top 데이터용 Analytics 쿼리 함수 
* Admin Dashboard(기본)

  * `/admin/dashboard`
  * KPI 카드(총 포스트, 오늘 방문자, 7/30일 통계)
  * Top Posts / Top Referrers 테이블
  * 최근 활동(포스트/댓글/문의) 
* 기존 기능 유지

  * Posts 관리, About 관리, 가비지 이미지 정리 

### 2.2 ❌ 미구현(명세서 필수/우선순위 높음)

* Dashboard 차트(트래픽 추이 차트: `getDailyStats()` 데이터 준비됨, 7/30 토글, 차트 라이브러리 필요—recharts 권장) 
* Dashboard SEO 상태 박스

  * 기술적 SEO 체크(sitemap/robots/canonical/JSON-LD 존재 여부)
  * 포스트 SEO 품질(누락 개수 집계) 
* 기술적 SEO 구현

  * `app/sitemap.ts`, `app/robots.ts`, canonical 명시, JSON-LD(Organization/Article/BreadcrumbList) 

---

## 3. 어드민 IA(정보구조) & 라우팅

### 3.1 공통

* 어드민은 **인증(관리자) 필수**
* 라우트(예시)

  * `/admin/login` : 로그인 
  * `/admin/dashboard` : 통합 대시보드(운영 지표)
  * `/admin/posts` : 포스트 목록/관리 
  * `/admin/posts/write` : 포스트 작성 
  * `/admin/posts/[id]` : 포스트 수정
  * `/admin/about` : 소개 페이지 관리(ko/en 탭, 에디터, 번역, 조회수 표시 등) 
  * (선택) `/admin/comments` : 댓글 관리(승인/삭제)
  * (선택) `/admin/inquiries` : 문의 관리(status 변경)
  * (이미 존재) 가비지 관리 UI(모달/페이지 형태) + `/api/garbage` 

### 3.2 인증(관리자)

* 로그인: Supabase Auth 이메일/비밀번호 
* 인증 훅: `useAuth`로 사용자/세션 확인, 로그인/로그아웃 제공 
* **주의:** 문서/코드에 기본 비밀번호를 고정값으로 남기지 말고(특히 공개 저장소), 프로덕션에서는 반드시 변경/비밀관리.

---

## 4. 데이터 모델(최종 목표 스키마)

> 아래는 “최종적으로 이렇게 되어 있어야 한다”는 **타겟 스키마**입니다.
> (이미 마이그레이션으로 적용된 항목도 포함)

### 4.1 `uslab_posts` (블로그 포스트)

* 핵심 컬럼: slug, title, content(Tiptap JSON), thumbnail_url 
* 다국어: `locale(ko|en)`, `canonical_id`로 KO/EN 그룹 
* SEO: `seo_title`, `seo_description`, `seo_keywords[]` 
* 상태: `is_published`, `published_at`, `created_at`, `updated_at` 
* 조회수: `view_count` 

**Slug/번역 규칙(운영 로직)**

* slug unique는 **(locale, slug)** 기준 , 운영 규칙도 동일 
* canonical_id 규칙

  * KO 원문: `canonical_id = id`(self)
  * EN 번역: `canonical_id = 원문 id` 

### 4.2 `uslab_post_versions` (버전 스냅샷)

* 포스트 발행/수정 시 스냅샷 저장(감사/복구/변경이력)
* 스키마 예시 

### 4.3 `uslab_about` (소개 페이지)

* ko/en 별도 row, content는 Tiptap JSON, view_count 포함 
* 스키마 예시 

### 4.4 `uslab_comments` (댓글)

* post_id FK, author_name, password_hash, content, is_approved 등 
* 운영 메모(권장):

  * 공개 작성/조회 가능
  * 수정/삭제는 API 레벨에서 비밀번호 확인(이미 그렇게 설계된 흐름) 

### 4.5 `uslab_inquiries` (문의)

* name, email, message, status(pending/contacted/completed) 

### 4.6 트래킹 테이블( Lite MVP )

Step 1에서 이미 들어간 구조(타겟) 

#### `uslab_sessions`

* 세션 단위 정보: session_id(unique), user_agent, referrer 등 

#### `uslab_page_views`

* 페이지뷰 이벤트: session FK, page_path, post_id(가능하면), created_at 

> 현재 구현에는 UTM/Referrer 파싱이 포함되어 있으므로 ,
> 세션 또는 page_views에 `utm_source/utm_medium/utm_campaign/utm_term/utm_content` 저장 컬럼을 추가하는 것을 **권장**합니다(없다면 다음 마이그레이션 후보).

---

## 5. API 명세(요약)

> Next.js App Router 기준: `app/api/**/route.ts`

### 5.1 Posts API

* `GET /api/posts` (목록, 관리자 all=true 등) 
* `POST /api/posts` (생성, 관리자 인증) 
* `GET /api/posts/[id]` (상세, 관리자/공개 분기) 
* `PUT /api/posts/[id]` (수정) 
* `DELETE /api/posts/[id]` (삭제) 
* `POST /api/posts/[id]/view` (조회수 증가) 

  * 프론트: `components/blog/PostViewer.tsx`에서 자동 호출, 중복 방지(useRef), 발행 글만 증가 

### 5.2 About API

* `GET /api/about?locale=ko|en` 
* `PUT /api/about` (관리자) 
* `POST /api/about/[locale]/view` (조회수 증가) 

  * 프론트: `components/about/AboutViewer.tsx` 동일 로직 

### 5.3 Comments API

* `GET /api/comments?postId=uuid` 
* `POST /api/comments` (공개 작성) 
* `PATCH /api/comments/[id]` (비밀번호 확인) 
* `DELETE /api/comments/[id]` (비밀번호 확인) 

### 5.4 Inquiries API (권장 추가/정리)

* (권장) `GET /api/inquiries` : 목록(관리자)
* (권장) `PATCH /api/inquiries/[id]` : status 변경(관리자)
* (권장) `DELETE /api/inquiries/[id]` : 삭제(관리자)

> 테이블은 존재하므로 , 어드민 운영 편의상 API를 명시적으로 두는 편을 추천합니다.

### 5.5 Upload / Garbage API

* `POST /api/upload` (관리자, 이미지 업로드) 
* `GET /api/garbage` (관리자, 미아 이미지 조회) 
* `DELETE /api/garbage` (관리자, 미아 이미지 삭제) 

### 5.6 AI API (현재/계획)

* `POST /api/ai/slug` (AI slug 생성) 
* `POST /api/ai/seo` (AI SEO 메타 생성) 
* `POST /api/ai/generate` (AI 이어쓰기, 미구현 상태로 표기됨) 
* 번역:

  * `POST /api/ai/translate-post` 
  * `POST /api/ai/translate-about` 

---

## 6. 트래킹 시스템(Lite MVP) 상세 명세

### 6.1 목표(현실적 범위)

* “대시보드 운영”에 필요한 최소 지표:

  * 오늘 방문(페이지뷰) 수
  * 최근 7일/30일 페이지뷰 합계
  * Top Posts (page_path/post_id 기준)
  * Top Referrers (referrer 기준)
  * (선택) UTM 캠페인별 유입

현재 MVP는 위 지표를 위한 쿼리 함수가 준비되어 있습니다 .

### 6.2 수집 방식

* 클라이언트 Tracker가

  * 세션 쿠키/스토리지 기반 session_id 관리
  * URL에서 UTM 파싱 + document.referrer 파싱
  * `/api/track`로 전송(sendBeacon 지원) 

### 6.3 Bot 필터링(필수)

* `/api/track`에서 **User-Agent 기반 bot 식별** 후 저장 제외 

  * 규칙(권장): `bot|spider|crawl|slurp|facebookexternalhit|preview` + 주요 봇 UA 포함
  * 오탐 방지를 위해 allowlist 방식도 가능(운영 데이터 보고 조정)

### 6.4 Retention(90일)

* 90일 지난 트래킹 로그 삭제 함수/정책 존재 
* 요구사항:

  * 운영 스케줄러(cron)는 Supabase Scheduled Triggers 또는 외부 cron(Vercel cron 등)로 1일 1회 실행
  * `created_at` 인덱스는 필수(삭제 성능)

### 6.5 Analytics Query 함수 계약(대시보드에서 사용)

* `getTodayStats()`: 오늘 page_views count
* `getRangeStats(days=7|30)`: 범위 합계
* `getTopPosts(range)`: 상위 N
* `getTopReferrers(range)`: referrer 상위 N
* `getDailyStats(range=7|30)`: 일별 시계열(차트용) 

> 실제 함수명은 이미 구현된 명칭을 따르되, **대시보드 차트는 `getDailyStats()` 결과만 있으면 바로 렌더 가능**한 형태로 유지합니다. 

---

## 7. 통합 대시보드(`/admin/dashboard`) 명세

### 7.1 화면 구성(현재 + 확장)

대시보드는 다음을 포함하는 방향이 명세에 잡혀 있고 , 현재 MVP에서 기본 카드/테이블/피드가 구현되어 있습니다 .

#### A) KPI 카드 (완료)

* 총 포스트 수(발행/초안)
* 총 조회수(가능하면 posts.view_count 합 + 또는 page_views 합)
* 오늘 방문자 수
* 7일/30일 지표 

#### B) Top 테이블 (완료)

* Top Posts
* Top Referrers 

#### C) 최근 활동 (완료)

* 최근 발행 포스트, 최근 댓글, 최근 문의 

#### D) 트래픽 추이 차트 (미구현/필수)

* 최근 7일/30일 일별 Pageviews
* 7일/30일 토글
* 데이터: `getDailyStats()` 
* 라이브러리: **Recharts 권장**(이미 방향 합의) 

#### E) SEO 상태 박스 (미구현/필수)

* 기술적 SEO 체크:

  * sitemap/robots/canonical/JSON-LD 존재 여부 
* 콘텐츠 SEO 품질:

  * `seo_title`/`seo_description` 누락 포스트 수
  * (권장) description 길이/타이틀 길이 기준 위반 개수

---

## 8. SEO 명세

### 8.1 콘텐츠 SEO(포스트 단위)

* `seo_title`: 60자 내 권장
* `seo_description`: 160자 내 권장
* OpenGraph 태그, hreflang 등은 “필수”로 잡혀있음 

### 8.2 기술적 SEO 체크리스트(필수 항목)

현재 체크리스트상 **미구현으로 표시된 필수 항목**:

* Sitemap.xml, Robots.txt, JSON-LD, Canonical URL 
  → 이 4개를 “기술적 SEO 구현(높은 우선순위)”로 진행 

### 8.3 `generateMetadata` 전략(다국어/hreflang)

* canonical_id를 활용해 alternates.languages(hreflang)를 자동 생성하는 방향이 명시되어 있음 
* 요구사항:

  * `/ko/blog/[slug]`, `/en/blog/[slug]` 각각 동일 canonical 그룹을 찾아 교차 링크 제공
  * title/description은 seo 필드 우선, 없으면 title fallback

### 8.4 미구현 기술 SEO 상세 요구사항(구현 대상)

미구현 정리 문서 기준 :

#### A) `app/sitemap.ts`

* 포함 대상: 발행된 포스트 전체 + 언어별 URL
* lastmod, priority 포함 

#### B) `app/robots.ts`

* sitemap 위치 명시
* `/admin/*`, `/api/*` 크롤링 차단 

#### C) Canonical URL

* 현재 hreflang만 있고 canonical 명시가 필요 
* 요구사항:

  * 각 포스트 상세에 `<link rel="canonical" href="...">` 확정
  * “같은 글의 언어별 canonical” 정책: 일반적으로 **각 언어 페이지는 자기 자신을 canonical**로 두고, hreflang로 묶는 구성이 안전(권장)

#### D) JSON-LD 구조화 데이터

* Organization(site-wide)
* Article(블로그 포스트)
* BreadcrumbList(블로그 상세) 

---

## 9. 어드민 기능 상세(운영 플로우)

### 9.1 Posts 관리(`/admin/posts`)

* 목록에서 보여줄 정보: 제목/상태/언어/slug/생성일/발행일/조회수 
* 추가(권장): 필터/정렬(언어/상태/날짜/조회수) → 향후 개선 항목에 포함 

### 9.2 Posts 작성/수정(`/admin/posts/write`, `/admin/posts/[id]`)

* Novel.sh(Tiptap) 기반 에디터 통합(진행된 구조) 
* 작성 시: title/slug/언어 선택, 초안 저장, 발행 
* 발행 시 운영 규칙(핵심):

  * SEO 메타 자동 생성(목표) + 버전 스냅샷 + published_at 설정 
  * slug 중복 체크(locale 내) 

### 9.3 번역(ko→en) 정책(운영 규칙)

* 원문 기준: ko
* canonical_id로 그룹 관리 
* 번역 모드(create/update/rebase) 및 텍스트 노드 번역/매칭 정책은 productContext에 정의 

### 9.4 About 관리(`/admin/about`)

* KO/EN 탭, 에디터, 유튜브 임베딩, 조회수 표시(관리자), 자동 번역, Markdown import/export 
* 데이터는 `uslab_about`의 locale row로 관리 

### 9.5 가비지 이미지 관리

* `/api/garbage`로 “포스트에서 사용되지 않는 이미지(미아)”를 조회/삭제 

---

## 10. 대시보드 UI/컴포넌트 가이드(권장)

### 10.1 차트

* Recharts 도입(라인 차트 1개로 시작)
* 입력 데이터 표준:

  * `{ date: 'YYYY-MM-DD', pageViews: number }[]`
* 7일/30일 토글은 상태만 바꿔서 `getDailyStats(range)` 재호출

### 10.2 테이블

* MVP는 단순 Table로 유지 가능
* 필터/정렬/페이지네이션이 커지면 TanStack Table 권장(헤드리스 + Tailwind 궁합)

---

## 11. 품질/보안/운영 요구사항

### 11.1 성능/비용

* 트래킹은 sendBeacon 기반으로 UX 영향 최소화 
* Retention 90일 강제(스토리지 방어) 

### 11.2 RLS/권한(원칙)

* 어드민 전용 CRUD는 authenticated(관리자)만 허용
* public read는 “발행된 글”만 허용(필요 시)
* 댓글은 public insert 허용 + 수정/삭제는 API에서 비밀번호 검증(이미 설계) 

### 11.3 SEO 점수 모니터링(향후)

* Lighthouse CI 통합 + 대시보드에 SEO 점수 표시 계획이 존재 
  (지금은 “SEO 상태 박스”를 먼저 구현하는 것이 우선 )

---

## 12. “지금부터 남은 작업” 체크리스트(바로 실행용)

### 12.1 Dashboard 차트(필수)

* [ ] Recharts 설치 및 대시보드에 라인 차트 추가
* [ ] `getDailyStats(7|30)` → 차트 데이터 연결
* [ ] 7/30 토글 UI 추가 

### 12.2 Dashboard SEO 상태 박스(필수)

* [ ] 기술적 SEO 파일/기능 존재 여부 체크(sitemap/robots/canonical/JSON-LD) 
* [ ] 포스트 SEO 품질 체크(누락 수 집계) 

### 12.3 기술적 SEO(필수)

* [ ] `app/sitemap.ts` (발행 포스트 + 언어별 URL, lastmod/priority) 
* [ ] `app/robots.ts` (sitemap 명시, /admin/* /api/* 차단) 
* [ ] canonical 명시 추가 
* [ ] JSON-LD(Organization/Article/BreadcrumbList) 추가 

---

## 13. 부록: 참고(원본 명세서/운영 계획에 포함된 추가 개선)

* “통합 대시보드”는 원본 명세서에서도 핵심 개선으로 잡혀 있음 
* 대시보드 내보내기(CSV/PDF), 필터/정렬 등은 향후 개선 항목으로 명시 
* 트래킹 고도화(디바이스/브라우저/지리/행동) 및 GA4 통합은 중기 과제 

---

원하시면, 위 “v1.1 통합 명세서”를 기준으로 **Cursor 작업 단위로 바로 쪼갠 TODO(파일 경로/함수 시그니처/컴포넌트 props까지 포함)** 형태로도 정리해드릴게요. (지금은 요청하신 “전체 명세서”를 먼저 완성본으로 드렸습니다.)

# USLab.ai 어드민 페이지, 대시보드, 유입률 트래킹 및 SEO 전략 명세서

> **작성 목적**: ChatGPT에게 전달하기 위한 현재 구현 사항 및 전체 명세서  
> **작성 일자**: 2025-01-15  
> **프로젝트**: uslab.ai 웹사이트

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [현재 구현 상태 요약](#2-현재-구현-상태-요약)
3. [어드민 페이지 시스템](#3-어드민-페이지-시스템)
4. [대시보드 시스템](#4-대시보드-시스템)
5. [유입률 트래킹 시스템](#5-유입률-트래킹-시스템)
6. [SEO 전략 및 구현](#6-seo-전략-및-구현)
7. [데이터베이스 스키마](#7-데이터베이스-스키마)
8. [API 엔드포인트 목록](#8-api-엔드포인트-목록)
9. [향후 개선 계획](#9-향후-개선-계획)

---

## 1. 프로젝트 개요

### 1.1 기본 정보
- **프로젝트명**: uslab.ai
- **도메인**: uslab.ai
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Vercel (Pro 플랜)

### 1.2 Supabase 프로젝트 구조
- **⚠️ 중요**: uslab.ai는 독립적인 Supabase 프로젝트가 **아니며**, ustudio 프로젝트(`gzguucdzsrfypbkqlyku`) 내에서 `uslab_` prefix로 구분되는 하나의 웹사이트입니다.
- **공유 구조**: 하나의 Supabase 프로젝트에 3개 웹사이트가 함께 사용됨
  - `ustudio.co.kr` → `ustudio_` prefix
  - `modoolucture` → `modu_` prefix
  - `uslab.ai` → `uslab_` prefix

### 1.3 기술 스택
- **프론트엔드**: Next.js 14, React 19, TypeScript
- **에디터**: Novel.sh (Tiptap 기반)
- **인증**: Supabase Auth
- **AI 기능**: Google Gemini 2.0 Flash (`@ai-sdk/google`)
- **다국어 지원**: 커스텀 i18n (ko/en)

---

## 2. 현재 구현 상태 요약

### ✅ 완료된 기능

#### 어드민 페이지
- ✅ 관리자 로그인 시스템 (`/admin/login`)
- ✅ 포스트 관리 페이지 (`/admin/posts`)
- ✅ 포스트 작성/수정 페이지 (`/admin/posts/write`, `/admin/posts/[id]`)
- ✅ 소개 페이지 관리 (`/admin/about`)
- ✅ 가비지 관리 (미아 이미지 정리)

#### 대시보드
- ✅ 포스트 목록 대시보드 (기본)
- ✅ 조회수 표시
- ✅ 발행/초안 상태 표시
- ✅ 언어별 필터링 (ko/en)

#### 유입률 트래킹
- ✅ 블로그 포스트 조회수 추적
- ✅ 소개 페이지 조회수 추적
- ✅ 원자적 조회수 증가 함수 (동시성 문제 방지)

#### SEO
- ✅ 동적 메타데이터 생성 (`generateMetadata`)
- ✅ hreflang 태그 자동 생성 (다국어 지원)
- ✅ OpenGraph 메타데이터
- ✅ AI 기반 SEO 메타데이터 자동 생성 (`/api/ai/seo`)

### ⚠️ 미구현/개선 필요 기능

#### 대시보드
- ❌ 통합 대시보드 페이지 (현재는 포스트 목록만)
- ❌ 통계 차트/그래프
- ❌ 실시간 트래픽 모니터링
- ❌ 유입 경로 분석
- ❌ 사용자 행동 추적

#### 유입률 트래킹
- ❌ Google Analytics 통합
- ❌ 유입 경로 추적 (Referrer)
- ❌ 사용자 세션 추적
- ❌ 디바이스/브라우저 분석
- ❌ 지리적 위치 분석

#### SEO
- ❌ Sitemap.xml 자동 생성
- ❌ Robots.txt 파일
- ❌ 구조화된 데이터 (JSON-LD)
- ❌ 페이지 속도 최적화 메트릭
- ❌ SEO 점수 모니터링

---

## 3. 어드민 페이지 시스템

### 3.1 인증 시스템

#### 로그인 페이지 (`/admin/login`)
- **파일 위치**: `app/admin/login/page.tsx`
- **기능**:
  - Supabase Auth 기반 이메일/비밀번호 로그인
  - 세션 관리 (localStorage)
  - 로그인 후 자동 리다이렉트

#### 인증 훅 (`useAuth`)
- **파일 위치**: `lib/hooks/useAuth.ts`
- **기능**:
  - 현재 사용자 정보 조회
  - 로그인/로그아웃 함수
  - 세션 상태 관리

#### 관리자 계정 생성
- **스크립트**: `scripts/create-admin-user.ts`
- **기본 계정**:
  - Email: `admin@uslab.ai`
  - Password: `uslabai@82` (⚠️ 프로덕션에서 변경 필요)

### 3.2 포스트 관리 페이지 (`/admin/posts`)

#### 주요 기능
- **파일 위치**: `app/admin/posts/page.tsx`
- **기능 목록**:
  1. 포스트 목록 조회 (발행/초안 모두)
  2. 포스트 상태 표시 (발행됨/초안)
  3. 언어 표시 (한국어/English)
  4. 조회수 표시
  5. 생성일/발행일 표시
  6. 포스트 수정/삭제
  7. 새 포스트 작성 버튼
  8. 가비지 관리 모달 (미아 이미지 정리)

#### UI 구성
- 반응형 디자인 (모바일/데스크톱)
- 다크 테마 (slate-950 배경)
- 상태 배지 (발행됨: 초록색, 초안: 노란색)
- 조회수 표시 (천 단위 구분)

### 3.3 포스트 작성/수정 페이지

#### 작성 페이지 (`/admin/posts/write`)
- **파일 위치**: `app/admin/posts/write/page.tsx`
- **기능**:
  - Novel.sh 에디터 통합
  - 제목, slug 입력
  - 언어 선택 (ko/en)
  - AI Slug 생성 (`/api/ai/slug`)
  - 초안 저장 / 발행 선택
  - 발행 시 AI SEO 메타데이터 자동 생성

#### 수정 페이지 (`/admin/posts/[id]`)
- **파일 위치**: `app/admin/posts/[id]/page.tsx`
- **기능**:
  - KO/EN 버전 탭 (`PostVersionTabs`)
  - 자동 번역 기능 (`TranslateActions`)
  - AI 교정 기능 (`/api/ai/refine`)
  - 버전 관리 (스냅샷 저장)
  - 이미지 업로드 및 관리

### 3.4 소개 페이지 관리 (`/admin/about`)

#### 주요 기능
- **파일 위치**: `app/admin/about/page.tsx`
- **기능 목록**:
  1. KO/EN 버전 탭 (`AboutVersionTabs`)
  2. Novel.sh 에디터 통합
  3. YouTube 임베딩 지원
  4. 조회수 표시 (관리자만)
  5. 자동 번역 기능
  6. Markdown Import/Export

#### 데이터 구조
- **테이블**: `uslab_about`
- **필드**: `id`, `locale`, `content` (Tiptap JSON), `view_count`, `created_at`, `updated_at`

### 3.5 가비지 관리

#### 기능
- **API**: `/api/garbage`
- **기능**:
  - 미아 이미지 조회 (포스트에서 사용되지 않는 이미지)
  - 이미지 미리보기
  - 선택 삭제 (다중 선택 지원)
  - 전체 선택/해제

---

## 4. 대시보드 시스템

### 4.1 현재 구현 상태

#### 포스트 목록 대시보드
- **위치**: `/admin/posts`
- **표시 정보**:
  - 포스트 제목
  - 상태 (발행됨/초안)
  - 언어 (한국어/English)
  - Slug
  - 생성일
  - 발행일
  - 조회수

#### 제한사항
- 현재는 단순 목록 형태만 제공
- 통계 차트/그래프 없음
- 실시간 모니터링 없음
- 필터링/정렬 기능 제한적

### 4.2 향후 구현 계획

#### 통합 대시보드 (`/admin/dashboard`)
- **필요 기능**:
  1. 전체 통계 카드
     - 총 포스트 수 (발행/초안)
     - 총 조회수
     - 오늘 방문자 수
     - 이번 주/월 방문자 수
  2. 조회수 차트
     - 일별/주별/월별 조회수 추이
     - 인기 포스트 TOP 10
  3. 최근 활동
     - 최근 발행된 포스트
     - 최근 댓글
     - 최근 문의
  4. 언어별 통계
     - 한국어/영어 포스트 비율
     - 언어별 조회수

---

## 5. 유입률 트래킹 시스템

### 5.1 현재 구현 상태

#### 블로그 포스트 조회수 추적

**데이터베이스**:
- **테이블**: `uslab_posts`
- **컬럼**: `view_count` (INTEGER, 기본값 0)
- **인덱스**: `uslab_idx_posts_view_count` (조회수 내림차순)

**함수**:
```sql
uslab_increment_view_count(post_id UUID) RETURNS INTEGER
```
- 원자적 증가 보장 (동시성 문제 방지)
- 발행된 포스트만 조회수 증가 (`is_published = true`)
- SECURITY DEFINER로 실행

**API 엔드포인트**:
- **경로**: `/api/posts/[id]/view`
- **메서드**: POST
- **인증**: 불필요 (공개 API)
- **응답**: `{ success: true, view_count: number }`

**프론트엔드 구현**:
- **컴포넌트**: `components/blog/PostViewer.tsx`
- **동작**:
  - 포스트 페이지 로드 시 자동 호출
  - `useRef`로 중복 증가 방지
  - 발행된 포스트만 조회수 증가
  - 에러 발생 시 무시 (사용자 경험 영향 최소화)

#### 소개 페이지 조회수 추적

**데이터베이스**:
- **테이블**: `uslab_about`
- **컬럼**: `view_count` (INTEGER, 기본값 0)
- **인덱스**: `uslab_idx_about_view_count`

**함수**:
```sql
uslab_increment_about_view_count(about_id UUID) RETURNS INTEGER
```

**API 엔드포인트**:
- **경로**: `/api/about/[locale]/view`
- **메서드**: POST
- **인증**: 불필요 (공개 API)

**프론트엔드 구현**:
- **컴포넌트**: `components/about/AboutViewer.tsx`
- **동작**: 블로그와 동일한 로직

### 5.2 제한사항

#### 현재 추적하지 않는 데이터
- ❌ 유입 경로 (Referrer)
- ❌ 사용자 세션 ID
- ❌ 디바이스 정보 (모바일/데스크톱)
- ❌ 브라우저 정보
- ❌ 지리적 위치 (국가/도시)
- ❌ 체류 시간
- ❌ 이탈률
- ❌ 사용자 행동 (스크롤, 클릭 등)

### 5.3 향후 구현 계획

#### 고급 트래킹 시스템

**1. 세션 추적 테이블**
```sql
CREATE TABLE uslab_sessions (
  id UUID PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  country TEXT,
  device_type TEXT, -- mobile/desktop/tablet
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. 페이지뷰 추적 테이블**
```sql
CREATE TABLE uslab_page_views (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES uslab_sessions(id),
  post_id UUID REFERENCES uslab_posts(id),
  page_path TEXT NOT NULL,
  view_duration INTEGER, -- 초 단위
  scroll_depth INTEGER, -- 0-100 (퍼센트)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. 이벤트 추적 테이블**
```sql
CREATE TABLE uslab_events (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES uslab_sessions(id),
  event_type TEXT NOT NULL, -- click, scroll, download, etc.
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. Google Analytics 통합**
- Google Analytics 4 (GA4) 통합
- 또는 자체 분석 대시보드 구축

---

## 6. SEO 전략 및 구현

### 6.1 현재 구현 상태

#### 동적 메타데이터 생성

**블로그 포스트 페이지** (`app/[lang]/blog/[slug]/page.tsx`):
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(lang, slug);
  const alternates = await getPostAlternates(post.canonical_id);
  
  return {
    title: post.seo_title || post.title,
    description: post.seo_description,
    keywords: post.seo_keywords,
    alternates: {
      languages: {
        ko: `/ko/blog/${slug}`,
        en: `/en/blog/${altSlug}`,
      },
    },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description,
      images: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    },
  };
}
```

**hreflang 태그 자동 생성**:
- `canonical_id`를 활용하여 같은 글의 다른 언어 버전 자동 연결
- Next.js가 자동으로 `<link rel="alternate" hreflang="ko" href="...">` 태그 생성

#### AI 기반 SEO 메타데이터 생성

**API 엔드포인트**: `/api/ai/seo`
- **모델**: Gemini 2.0 Flash
- **입력**: 제목, 콘텐츠 (최대 2000자)
- **출력**: 
  ```json
  {
    "seo_title": "검색 엔진 최적화된 제목 (60자 이내)",
    "seo_description": "검색 엔진 최적화된 설명 (160자 이내)",
    "seo_keywords": ["키워드1", "키워드2", "키워드3"]
  }
  ```
- **Fallback 전략**: JSON 파싱 실패 시 기본값 사용

**발행 시 자동 생성**:
- 포스트 발행 시 자동으로 SEO 메타데이터 생성
- 관리자가 수동으로 수정 가능

#### 데이터베이스 SEO 필드

**테이블**: `uslab_posts`
- `seo_title`: 검색 엔진 최적화된 제목
- `seo_description`: 검색 엔진 최적화된 설명
- `seo_keywords`: 키워드 배열 (TEXT[])

### 6.2 미구현 SEO 기능

#### 1. Sitemap.xml
- **필요성**: 검색 엔진 크롤링 최적화
- **구현 계획**:
  - `app/sitemap.ts` 파일 생성
  - 모든 발행된 포스트 URL 자동 생성
  - 언어별 URL 포함
  - 최종 수정일 (`lastmod`) 포함
  - 우선순위 (`priority`) 설정

#### 2. Robots.txt
- **필요성**: 검색 엔진 크롤러 제어
- **구현 계획**:
  - `app/robots.ts` 파일 생성
  - Sitemap 위치 명시
  - 관리자 페이지 크롤링 차단 (`/admin/*`)
  - API 경로 크롤링 차단 (`/api/*`)

#### 3. 구조화된 데이터 (JSON-LD)
- **필요성**: 리치 스니펫 표시
- **구현 계획**:
  - 블로그 포스트: `Article` 스키마
  - 조직 정보: `Organization` 스키마
  - BreadcrumbList 스키마

#### 4. 페이지 속도 최적화
- **필요성**: Core Web Vitals 개선
- **구현 계획**:
  - 이미지 최적화 (Next.js Image 컴포넌트 활용)
  - 코드 스플리팅
  - 폰트 최적화 (이미 구현됨)
  - 캐싱 전략

#### 5. SEO 점수 모니터링
- **필요성**: SEO 성과 측정
- **구현 계획**:
  - Lighthouse CI 통합
  - 정기적인 SEO 점수 체크
  - 대시보드에 SEO 점수 표시

### 6.3 SEO 체크리스트

#### 필수 항목
- ✅ 메타 타이틀 (60자 이내)
- ✅ 메타 설명 (160자 이내)
- ✅ OpenGraph 태그
- ✅ hreflang 태그 (다국어)
- ✅ 반응형 디자인
- ✅ 빠른 로딩 속도
- ❌ Sitemap.xml
- ❌ Robots.txt
- ❌ 구조화된 데이터 (JSON-LD)
- ❌ Canonical URL 명시

#### 권장 항목
- ❌ Twitter Card 메타데이터
- ❌ 이미지 alt 텍스트 검증
- ❌ 내부 링크 최적화
- ❌ 외부 링크 nofollow 설정
- ❌ 301 리다이렉트 (slug 변경 시)

---

## 7. 데이터베이스 스키마

### 7.1 블로그 관련 테이블

#### `uslab_posts`
```sql
CREATE TABLE uslab_posts (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Tiptap JSON
  thumbnail_url TEXT,
  locale TEXT DEFAULT 'ko' CHECK (locale IN ('ko', 'en')),
  canonical_id UUID REFERENCES uslab_posts(id),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);
```

**인덱스**:
- `uslab_idx_posts_locale_slug` (UNIQUE): (locale, slug)
- `uslab_idx_posts_published`: (is_published, published_at DESC)
- `uslab_idx_posts_view_count`: (view_count DESC)
- `uslab_idx_posts_canonical`: (canonical_id)

#### `uslab_post_versions`
```sql
CREATE TABLE uslab_post_versions (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES uslab_posts(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  change_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 소개 페이지 테이블

#### `uslab_about`
```sql
CREATE TABLE uslab_about (
  id UUID PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  content JSONB NOT NULL, -- Tiptap JSON
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 댓글 테이블

#### `uslab_comments`
```sql
CREATE TABLE uslab_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES uslab_posts(id),
  author_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.4 문의 테이블

#### `uslab_inquiries`
```sql
CREATE TABLE uslab_inquiries (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. API 엔드포인트 목록

### 8.1 포스트 관련 API

#### `GET /api/posts`
- **설명**: 포스트 목록 조회
- **쿼리 파라미터**:
  - `all=true`: 관리자용 (초안 포함)
  - `locale=ko|en`: 언어 필터
  - `page=1`: 페이지 번호
  - `limit=10`: 페이지당 개수
- **인증**: 선택적 (관리자는 모든 포스트 조회 가능)

#### `POST /api/posts`
- **설명**: 새 포스트 생성
- **인증**: 필수 (관리자)
- **요청 본문**:
  ```json
  {
    "title": "포스트 제목",
    "slug": "post-slug",
    "content": { /* Tiptap JSON */ },
    "locale": "ko",
    "is_published": false
  }
  ```

#### `GET /api/posts/[id]`
- **설명**: 포스트 상세 조회
- **인증**: 선택적 (관리자는 초안도 조회 가능)

#### `PUT /api/posts/[id]`
- **설명**: 포스트 수정
- **인증**: 필수 (관리자)

#### `DELETE /api/posts/[id]`
- **설명**: 포스트 삭제
- **인증**: 필수 (관리자)

#### `POST /api/posts/[id]/view`
- **설명**: 조회수 증가
- **인증**: 불필요 (공개 API)

### 8.2 AI 관련 API

#### `POST /api/ai/slug`
- **설명**: AI 기반 slug 생성
- **인증**: 필수 (관리자)
- **요청 본문**: `{ "title": "포스트 제목" }`

#### `POST /api/ai/seo`
- **설명**: AI 기반 SEO 메타데이터 생성
- **인증**: 필수 (관리자)
- **요청 본문**: `{ "title": "제목", "content": "콘텐츠" }`

#### `POST /api/ai/generate`
- **설명**: AI 이어쓰기 (Streaming)
- **인증**: 필수 (관리자)
- **상태**: 미구현

#### `POST /api/ai/refine`
- **설명**: AI 교정
- **인증**: 필수 (관리자)
- **상태**: 미구현

#### `POST /api/ai/translate-post`
- **설명**: 포스트 자동 번역
- **인증**: 필수 (관리자)
- **요청 본문**: `{ "postId": "uuid", "mode": "create|update|rebase" }`

#### `POST /api/ai/translate-about`
- **설명**: 소개 페이지 자동 번역
- **인증**: 필수 (관리자)

### 8.3 소개 페이지 API

#### `GET /api/about`
- **설명**: 소개 페이지 조회
- **쿼리 파라미터**: `locale=ko|en`

#### `PUT /api/about`
- **설명**: 소개 페이지 수정
- **인증**: 필수 (관리자)

#### `POST /api/about/[locale]/view`
- **설명**: 소개 페이지 조회수 증가
- **인증**: 불필요 (공개 API)

### 8.4 댓글 API

#### `GET /api/comments`
- **설명**: 댓글 목록 조회
- **쿼리 파라미터**: `postId=uuid`

#### `POST /api/comments`
- **설명**: 댓글 작성
- **인증**: 불필요 (공개 API)

#### `PATCH /api/comments/[id]`
- **설명**: 댓글 수정
- **인증**: 비밀번호 확인

#### `DELETE /api/comments/[id]`
- **설명**: 댓글 삭제
- **인증**: 비밀번호 확인

### 8.5 기타 API

#### `POST /api/upload`
- **설명**: 이미지 업로드
- **인증**: 필수 (관리자)
- **응답**: `{ "url": "https://..." }`

#### `GET /api/garbage`
- **설명**: 미아 이미지 조회
- **인증**: 필수 (관리자)

#### `DELETE /api/garbage`
- **설명**: 미아 이미지 삭제
- **인증**: 필수 (관리자)

---

## 9. 향후 개선 계획

### 9.1 대시보드 개선

#### 우선순위: 높음
1. **통합 대시보드 페이지** (`/admin/dashboard`)
   - 전체 통계 카드
   - 조회수 차트 (일별/주별/월별)
   - 인기 포스트 TOP 10
   - 최근 활동 피드

2. **필터링 및 정렬 기능**
   - 날짜 범위 필터
   - 언어별 필터
   - 발행/초안 필터
   - 조회수/날짜 정렬

3. **내보내기 기능**
   - 포스트 목록 CSV 내보내기
   - 통계 리포트 PDF 생성

### 9.2 유입률 트래킹 개선

#### 우선순위: 중간
1. **세션 추적 시스템**
   - 사용자 세션 ID 생성
   - 세션별 페이지뷰 추적
   - 세션 지속 시간 측정

2. **고급 분석 기능**
   - 유입 경로 분석 (Referrer)
   - 디바이스/브라우저 분석
   - 지리적 위치 분석
   - 사용자 행동 추적 (스크롤, 클릭)

3. **Google Analytics 통합**
   - GA4 통합
   - 이벤트 추적
   - 커스텀 이벤트

### 9.3 SEO 개선

#### 우선순위: 높음
1. **Sitemap.xml 자동 생성**
   - `app/sitemap.ts` 구현
   - 모든 발행된 포스트 URL 포함
   - 언어별 URL 포함
   - 정기적 업데이트

2. **Robots.txt 생성**
   - `app/robots.ts` 구현
   - 관리자 페이지 크롤링 차단
   - Sitemap 위치 명시

3. **구조화된 데이터 (JSON-LD)**
   - Article 스키마
   - Organization 스키마
   - BreadcrumbList 스키마

#### 우선순위: 중간
4. **페이지 속도 최적화**
   - 이미지 최적화
   - 코드 스플리팅
   - 캐싱 전략

5. **SEO 점수 모니터링**
   - Lighthouse CI 통합
   - 정기적인 SEO 점수 체크
   - 대시보드에 SEO 점수 표시

### 9.4 기타 개선

#### 우선순위: 낮음
1. **이메일 알림**
   - 새 댓글 알림
   - 새 문의 알림

2. **백업 시스템**
   - 정기적인 데이터베이스 백업
   - 이미지 백업

3. **성능 모니터링**
   - API 응답 시간 모니터링
   - 에러 로깅 및 알림

---

## 10. 기술적 세부사항

### 10.1 환경 변수

#### 필수 환경 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google AI (Gemini)
GOOGLE_API_KEY=xxx
```

### 10.2 파일 구조

```
uslab-web/
├── app/
│   ├── [lang]/              # 다국어 라우팅
│   │   ├── blog/            # 블로그 페이지
│   │   └── about/           # 소개 페이지
│   ├── admin/               # 어드민 페이지
│   │   ├── login/           # 로그인
│   │   ├── posts/           # 포스트 관리
│   │   └── about/           # 소개 페이지 관리
│   └── api/                 # API 라우트
│       ├── posts/          # 포스트 API
│       ├── ai/              # AI API
│       ├── about/           # 소개 페이지 API
│       └── comments/        # 댓글 API
├── components/
│   ├── admin/               # 어드민 컴포넌트
│   ├── blog/                # 블로그 컴포넌트
│   └── editor/              # 에디터 컴포넌트
├── lib/
│   ├── hooks/               # React 훅
│   ├── queries/             # 데이터베이스 쿼리
│   ├── types/               # TypeScript 타입
│   └── utils/               # 유틸리티 함수
└── supabase/
    └── migrations/          # 데이터베이스 마이그레이션
```

### 10.3 주요 의존성

```json
{
  "dependencies": {
    "next": "^16.0.10",
    "react": "^19.2.3",
    "@supabase/supabase-js": "^2.45.4",
    "novel": "^1.0.2",
    "@tiptap/react": "^3.13.0",
    "ai": "^5.0.112",
    "@ai-sdk/google": "^2.0.46"
  }
}
```

---

## 11. 참고 문서

### 프로젝트 내 문서
- `memory_bank/projectbrief.md`: 프로젝트 개요
- `memory_bank/techContext.md`: 기술 스택 정보
- `memory_bank/productContext.md`: 비즈니스 로직
- `memory_bank/progress.md`: 완료된 작업 내역
- `README.md`: 프로젝트 README
- `README_ADMIN.md`: 어드민 사용 가이드

### 외부 문서
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tiptap Documentation](https://tiptap.dev/docs)
- [Google Gemini API](https://ai.google.dev/docs)

---

## 12. 문의 및 지원

프로젝트 관련 문의사항이 있으시면 다음을 참고하세요:

1. **메모리 뱅크 문서**: `memory_bank/` 디렉토리
2. **코드 주석**: 주요 함수 및 컴포넌트에 주석 포함
3. **GitHub 리포지토리**: https://github.com/ustudiopd/uslab-web

---

**작성 완료일**: 2025-01-15  
**최종 업데이트**: 2025-01-15

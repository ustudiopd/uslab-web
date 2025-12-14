# 📄 프로젝트: USLab 블로그 시스템 통합 계획

## 1. 개요 (Overview)

* **목표:** USLab.ai 웹사이트에 지능형 블로그 시스템을 단계적으로 통합하여 AI 연구 인사이트 및 기술 아티클을 공유하는 플랫폼 구축
* **핵심 철학:** "작성은 Notion처럼 직관적이고 빠르게, 결과물은 매거진처럼 아름답게" 제공하는 CMS 구축
* **통합 전략:** 단계적 통합 (Phase별 점진적 기능 추가)
* **타겟:**
  * **Admin(작성자):** 빠른 마크다운 호환성, AI 교정, 자동 저장 및 버전 관리
  * **User(방문자):** 높은 가독성, 빠른 로딩(SSR), 검색 엔진 최적화된 페이지

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 선정 사유 |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+ (App Router)** | 서버 컴포넌트(RSC)를 통한 SEO 및 성능 최적화 (기존 프로젝트와 동일) |
| **Database** | **Supabase (PostgreSQL)** | JSONB 데이터 저장, 인증, 스토리지 통합 (기존 프로젝트와 동일) |
| **Editor** | **Novel (`novel`)** | Tiptap 기반, Notion 스타일 UI(슬래시 메뉴) 기구현 |
| **Viewer** | **Tailwind Typography** | `prose` 클래스로 JSON 데이터를 매거진 스타일로 렌더링 |
| **AI Model** | **Google Gemini 2.0 Flash** | 멀티모달 지원, 빠른 속도, 긴 문맥 이해 (Vercel AI SDK 연동) |
| **Hosting** | **Vercel** | Next.js 최적화 배포 환경 (기존 프로젝트와 동일) |

---

## 3. 데이터베이스 스키마 (Supabase SQL)

**⚠️ 중요: 모든 테이블 및 객체는 `uslab_` prefix를 사용하여 기존 스키마 분리 전략을 준수합니다.**

### A. 게시글 테이블 (`uslab_posts`)

```sql
create table uslab_posts (
  id uuid default gen_random_uuid() primary key,
  slug text not null,                   -- URL 경로 (예: /blog/ai-trend-2025)
  title text not null,                  -- 에디터 상단 제목
  content jsonb not null,               -- Tiptap JSON 데이터 (핵심)
  thumbnail_url text,                   -- 대표 이미지
  
  -- 다국어 지원
  locale text default 'ko' check (locale in ('ko', 'en')),  -- 포스트 언어
  canonical_id uuid references uslab_posts(id),             -- KOR/ENG 짝 연결
  -- canonical_id 사용 규칙:
  -- 1. 원본(한국어) 생성 시: canonical_id = id (self 참조)
  -- 2. 번역(영어) 생성 시: canonical_id = 원본 id
  -- 3. 같은 canonical_id를 가진 포스트들이 하나의 "글 그룹"
  
  -- SEO 메타 데이터 (AI 자동 생성)
  seo_title text,                       -- 검색 노출용 제목 ( <title> )
  seo_description text,                 -- 검색 노출용 요약 ( <meta name="description"> )
  seo_keywords text[],                  -- 키워드 태그 배열
  
  -- 상태 관리
  is_published boolean default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  author_id uuid references auth.users(id)
);

-- 인덱스 생성
-- (locale, slug) 조합으로 unique 제약 (같은 slug를 다른 언어에서 사용 가능)
create unique index uslab_idx_posts_locale_slug on uslab_posts(locale, slug);
create index uslab_idx_posts_published on uslab_posts(is_published, published_at desc);
create index uslab_idx_posts_created_at on uslab_posts(created_at desc);
create index uslab_idx_posts_locale on uslab_posts(locale, is_published, published_at desc);  -- 다국어 지원 인덱스
create index uslab_idx_posts_canonical on uslab_posts(canonical_id);  -- canonical_id 조회용 인덱스

-- updated_at 자동 업데이트 트리거
create or replace function uslab_update_post_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_post_updated_at
  before update on uslab_posts
  for each row
  execute function uslab_update_post_updated_at();

-- canonical_id 자동 설정 트리거 (원본 생성 시 self 참조)
create or replace function uslab_set_canonical_id()
returns trigger as $$
begin
  if new.canonical_id is null then
    new.canonical_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_set_canonical_id
  before insert on uslab_posts
  for each row
  execute function uslab_set_canonical_id();
```

### B. 버전 관리 테이블 (`uslab_post_versions`)

AI 수정 전/후를 비교하거나 되돌리기 위해 사용합니다.

```sql
create table uslab_post_versions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references uslab_posts(id) on delete cascade,
  content jsonb not null,               -- 당시 콘텐츠 스냅샷
  change_log text,                      -- 변경 사유 (예: "AI 톤앤매너 교정")
  created_at timestamp with time zone default now()
);

-- 인덱스 생성
create index uslab_idx_post_versions_post_id on uslab_post_versions(post_id, created_at desc);
```

### C. RLS (Row Level Security) 정책

**⚠️ 참고: USLab는 내부 관리자만 사용하므로, 인증된 사용자에게 모든 권한을 부여합니다.**

```sql
-- uslab_posts 테이블 RLS 활성화
alter table uslab_posts enable row level security;
alter table uslab_post_versions enable row level security;

-- 공개 읽기 정책 (발행된 포스트만)
create policy uslab_policy_posts_select_public
  on uslab_posts
  for select
  using (is_published = true);

-- 인증된 사용자만 작성/수정/삭제 (관리자 전용)
create policy uslab_policy_posts_insert_authenticated
  on uslab_posts
  for insert
  with check (auth.role() = 'authenticated');

create policy uslab_policy_posts_update_authenticated
  on uslab_posts
  for update
  using (auth.role() = 'authenticated');

create policy uslab_policy_posts_delete_authenticated
  on uslab_posts
  for delete
  using (auth.role() = 'authenticated');

-- 버전 관리 테이블 정책 (인증된 사용자만)
create policy uslab_policy_post_versions_select_authenticated
  on uslab_post_versions
  for select
  using (auth.role() = 'authenticated');

create policy uslab_policy_post_versions_insert_authenticated
  on uslab_post_versions
  for insert
  with check (auth.role() = 'authenticated');
```

**RLS 정책 설계 의도:**
- 공개 사용자(anon): 발행된 포스트만 조회 가능
- 인증된 사용자(authenticated): 모든 CRUD 권한 (USLab 내부 관리자 전용)
- 향후 필요시 author_id 기반 제약 추가 가능

---

## 4. 단계별 개발 계획 (Phase별 통합)

### Phase 1: 기본 블로그 인프라 구축 ⭐ (최우선)

**목표:** 블로그 기본 기능 구현 (CRUD, 뷰어)

**작업 내용:**
1. **데이터베이스 마이그레이션**
   - `uslab_posts` 테이블 생성
   - `uslab_post_versions` 테이블 생성
   - RLS 정책 설정
   - 인덱스 생성

2. **파일 구조 생성**
   ```
   app/
     [lang]/
       blog/
         page.tsx            # 블로그 목록 페이지 (/ko/blog, /en/blog)
         [slug]/
           page.tsx          # 블로그 상세 페이지 (/ko/blog/..., /en/blog/...)
     admin/
       posts/
         page.tsx            # 관리자 포스트 목록
         write/
           page.tsx          # 새 포스트 작성
         [id]/
           page.tsx          # 포스트 편집

   components/
     blog/
       PostCard.tsx          # 포스트 카드 컴포넌트
       PostList.tsx          # 포스트 목록 컴포넌트
       PostViewer.tsx        # 포스트 뷰어 (Tailwind Typography)

   lib/
     queries/
       posts.ts              # 포스트 쿼리 함수 (uslab_ prefix 자동 적용)
       # 주요 함수:
       # - getPostBySlug(lang: 'ko' | 'en', slug: string)
       # - getPublishedPosts(lang: 'ko' | 'en', { page, limit })
       # - createPost(data)
       # - updatePost(id, data)
       # - deletePost(id)
     types/
       blog.ts               # 블로그 타입 정의
       # UslabPost 인터페이스 포함
   ```

3. **기본 기능 구현**
   
   **3-1. 타입 정의 및 쿼리 함수**
   - `lib/types/blog.ts`: `UslabPost` 인터페이스 정의
   - `lib/queries/posts.ts`: Supabase 쿼리 함수 구현
     - `getPostBySlug(lang, slug)`: 상세 포스트 조회
     - `getPublishedPosts(lang, { page, limit })`: 목록 조회 (페이지네이션)
     - `createPost(data)`: 새 포스트 생성
     - `updatePost(id, data)`: 포스트 수정
     - `deletePost(id)`: 포스트 삭제
   
   **3-2. 블로그 페이지 구현**
   - `app/[lang]/blog/page.tsx`: 블로그 목록 페이지
     - Server Component로 구현
     - `getPublishedPosts()` 호출하여 데이터 로드
     - 페이지네이션 UI 구현
     - `PostList` 컴포넌트 사용
   - `app/[lang]/blog/[slug]/page.tsx`: 블로그 상세 페이지
     - Server Component로 구현
     - `getPostBySlug()` 호출하여 데이터 로드
     - `generateMetadata()`로 SEO 메타데이터 생성
     - `PostViewer` 컴포넌트로 콘텐츠 렌더링
   
   **3-3. 블로그 컴포넌트 구현**
   - `components/blog/PostCard.tsx`: 포스트 카드 컴포넌트
     - 썸네일, 제목, 요약, 날짜 표시
     - 클릭 시 상세 페이지로 이동
   - `components/blog/PostList.tsx`: 포스트 목록 컴포넌트
     - `PostCard`를 그리드 레이아웃으로 배치
     - 반응형 디자인 (모바일 1열, 데스크톱 2-3열)
   - `components/blog/PostViewer.tsx`: 포스트 뷰어 컴포넌트
     - Tiptap JSON을 HTML로 변환
     - Tailwind Typography (`prose` 클래스) 적용
     - 가독성 최적화 (최대 너비 제한)
   
   **3-4. Admin 페이지 구현**
   - `app/admin/posts/page.tsx`: 관리자 포스트 목록
     - 발행/초안 상태 표시
     - 수정/삭제 버튼
   - `app/admin/posts/write/page.tsx`: 새 포스트 작성
     - **Novel.sh 최소 버전 에디터 통합** (Phase 1부터 Tiptap JSON 사용)
       - 기본 블록만 지원 (헤딩, 단락, 리스트)
       - 슬래시 메뉴, 드래그앤드롭, AI 기능은 Phase 2에서 추가
       - 마이그레이션 없이 Phase 2로 자연스럽게 확장 가능
     - 언어 선택 (ko/en)
     - slug 자동 생성 또는 수동 입력
     - 발행 버튼
   - `app/admin/posts/[id]/page.tsx`: 포스트 편집
     - 기존 포스트 데이터 로드
     - Novel.sh 에디터에 콘텐츠 표시
     - 수정/삭제 기능
   
   **3-5. API 엔드포인트 구현**
   - `app/api/posts/route.ts`: GET (목록), POST (생성)
   - `app/api/posts/[id]/route.ts`: GET (상세), PUT (수정), DELETE (삭제)
   
   **3-6. UI 통합**
   - Navbar에 "Blog" 메뉴 추가
     - 위치: Services와 Portfolio 사이 또는 Portfolio 다음
     - 모바일 메뉴에도 동일하게 추가
     - `/ko/blog`, `/en/blog` 링크

4. **필요한 패키지**
   ```json
   {
     "@tailwindcss/typography": "^0.5.x",
     "novel": "^0.0.xxx",  // Phase 1부터 Novel 최소 버전 사용
     "@tiptap/react": "^2.x.x",
     "@tiptap/starter-kit": "^2.x.x"
   }
   ```

**⚠️ Phase 1 전략 결정:**
- **선택: Phase 1부터 Tiptap JSON 저장**
- 이유: 마이그레이션 불필요, Phase 2로 자연스러운 확장, DB 구조 안정성
- Phase 1: Novel 최소 기능 (헤딩, 단락, 리스트)
- Phase 2: 슬래시 메뉴, 이미지, 드래그앤드롭, 고급 기능 추가

**예상 작업 시간:** 2-3일

---

### Phase 2: Novel.sh 에디터 통합

**목표:** Notion 스타일 고급 에디터 구현

**작업 내용:**
1. **패키지 설치**
   ```json
   {
     "novel": "^0.0.xxx",
     "@tiptap/react": "^2.x.x",
     "@tiptap/starter-kit": "^2.x.x",
     "@tiptap/extension-markdown": "^2.x.x"
   }
   ```

2. **에디터 통합**
   - `/admin/posts/write` 페이지에 Novel.sh 에디터 통합
   - 마크다운 import 기능 (옵시디언 호환)
   - 슬래시(`/`) 명령어 메뉴
   - 블록 단위 드래그 앤 드롭

3. **이미지 업로드 기능**
   - `/api/upload` API 구현
   - Supabase Storage 연동
   - 이미지 `Ctrl+V` 시 자동 업로드

4. **자동 저장 기능**
   - 로컬 스토리지 백업
   - 주기적 자동 저장 (debounce)

**예상 작업 시간:** 2-3일

**의존성:** Phase 1 완료 필요

---

### Phase 3: AI 기능 통합 (Gemini 2.0)

**목표:** AI 기반 콘텐츠 보조 기능

**작업 내용:**
1. **패키지 설치**
   ```json
   {
     "ai": "^3.x.x",  // Vercel AI SDK
     "@google/generative-ai": "^0.x.x"
   }
   ```

2. **AI API 엔드포인트 구현**
   - `/api/ai/generate` - AI 이어쓰기 (Novel.sh 기본 기능)
   - `/api/ai/refine` - 문단별 AI 교정
   - `/api/ai/seo` - SEO 메타데이터 자동 생성

3. **AI Copilot UI 구현**
   - 문단 선택 시 'AI 수정' 버튼 활성화
   - Diff View (수정 전/후 비교)
   - Reasoning 표시 (수정 이유)
   - Action 버튼 (수락/거절/재요청)

4. **발행 프로세스 개선**
   - 발행 시 AI SEO Agent 자동 실행
     - **초기 전략: 동기 처리** (발행 버튼 → SEO 생성 대기 → 저장)
     - 느릴 경우 향후 비동기로 전환 가능 (발행 즉시 처리, SEO는 백그라운드)
   - `revalidatePath('/blog')` 호출
   
5. **SEO 키워드 포맷 통일**
   - AI 프롬프트에서 "반드시 JSON 배열(string[])로만 응답" 명시
   - 예: `["ai", "콘텐츠", "마케팅"]`
   - 서버에서 바로 `text[]` 타입에 매핑

**예상 작업 시간:** 3-4일

**의존성:** Phase 2 완료 필요

---

### Phase 4: SEO 및 고급 기능

**목표:** SEO 최적화 및 완성도 향상

**작업 내용:**
1. **SEO 최적화**
   - `generateMetadata` 함수로 동적 SEO 메타데이터
     - `params.lang` + `slug`로 포스트 조회
     - 동일 `canonical_id`를 가진 다른 locale 포스트들을 찾아서
     - `alternates.languages`에 매핑 (hreflang 태그 자동 생성)
   - Open Graph 이미지 자동 생성
   - 구조화된 데이터 (JSON-LD) 추가

2. **고급 기능**
   - 블로그 목록 페이지네이션 개선
   - 검색 기능 (제목, 내용 검색)
   - 태그/카테고리 시스템 (선택적)
   - 관련 포스트 추천

3. **성능 최적화**
   - 이미지 최적화 (Next.js Image)
   - 정적 생성 (ISR) 전략
   - 캐싱 전략

**예상 작업 시간:** 2-3일

**의존성:** Phase 1-3 완료 필요

---

## 5. UI/UX 통합 고려사항

### 디자인 일관성
- 기존 다크 테마 (slate-950) 유지
- 기존 색상 팔레트 활용 (cyan-500, blue-600)
- 기존 폰트 시스템 활용 (Noto Sans KR, JetBrains Mono)

### 네비게이션 통합
- Navbar에 "Blog" 메뉴 항목 추가
  - 위치: Services와 Portfolio 사이 또는 Portfolio 다음
  - 모바일 메뉴에도 동일하게 추가

### 반응형 디자인
- 모바일 우선 설계
- 블로그 목록: 그리드 레이아웃 (모바일 1열, 데스크톱 2-3열)
- 블로그 상세: 최대 너비 제한 (가독성)

### 다국어 지원
- **서버 사이드 i18n 라우팅**: `/ko`, `/en` URL 구조
- 기존 i18n 시스템 재활용 (Context를 URL 기반으로 재배선)
- 블로그 관련 번역 키 추가
- 포스트 내용은 `locale` 컬럼으로 언어 구분 (`'ko' | 'en'`)
- 블로그 URL: `/ko/blog/...`, `/en/blog/...`

---

## 6. API 엔드포인트 설계

| 경로 | 메서드 | Phase | 역할 | 입력값 | 출력값 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/posts` | GET | 1 | 포스트 목록 조회 | `?lang=ko&page=1&limit=10` | `{ posts: [], total: number }` |
| `/api/posts` | POST | 1 | 새 포스트 생성 | `{ title, slug, content, locale }` | `{ id, ... }` |
| `/api/posts/[id]` | GET | 1 | 포스트 상세 조회 | `?lang=ko` | `{ post }` |
| `/api/posts/[id]` | PUT | 1 | 포스트 수정 | `{ title, content, ... }` | `{ post }` |
| `/api/posts/[id]` | DELETE | 1 | 포스트 삭제 | - | `{ success: boolean }` |
| `/api/upload` | POST | 2 | 이미지 업로드 | `FormData(file)` | `{ url: "..." }` |
| `/api/ai/generate` | POST | 3 | AI 이어쓰기 | `{ prompt, context }` | `Streaming Text` |
| `/api/ai/refine` | POST | 3 | 문단 교정 (Copilot) | `{ text, tone_prompt }` | `{ original, suggested, diff, reason }` |
| `/api/ai/seo` | POST | 3 | SEO 메타 생성 | `{ full_content }` | `{ title, desc, keywords }` |

**참고사항:**
- API 경로는 `/api/posts`로 통일 (DB prefix `uslab_`는 내부적으로만 사용)
- Server Component에서 직접 `lib/queries/posts.ts` 함수 호출 권장 (성능 최적화)
- 타입 정의는 `lib/types/blog.ts`에 `UslabPost` 인터페이스로 통일
- **다국어 지원**: 모든 쿼리 함수에 `lang` 파라미터 추가 (`locale` 컬럼 필터링)

---

## 7. 개발 우선순위 및 일정

| Phase | 예상 작업 시간 | 우선순위 | 의존성 | 상태 |
|-------|---------------|----------|--------|------|
| Phase 1: 기본 블로그 | 2-3일 | 높음 | 없음 | 대기 중 |
| Phase 2: Novel.sh 에디터 | 2-3일 | 중간 | Phase 1 | 대기 중 |
| Phase 3: AI 기능 | 3-4일 | 중간 | Phase 2 | 대기 중 |
| Phase 4: SEO 및 고급 기능 | 2-3일 | 낮음 | Phase 1-3 | 대기 중 |

**총 예상 작업 시간:** 9-13일

---

## 8. 다음 단계

**Phase 1 시작 준비:**
1. 데이터베이스 마이그레이션 파일 생성
2. 기본 블로그 페이지 구조 생성
3. Navbar에 Blog 메뉴 추가
4. 타입 정의 및 쿼리 함수 작성

**승인 후 진행:**
- "ACT" 또는 "실행해" 명령 시 Phase 1부터 시작

---

**참고사항:**
- 모든 데이터베이스 객체는 `uslab_` prefix를 사용하여 기존 스키마 분리 전략을 준수합니다.
- 기존 USLab 웹사이트 구조와 완전히 통합되도록 설계되었습니다.
- 각 Phase는 독립적으로 테스트 가능하며, 필요에 따라 단계별로 배포 가능합니다.

---

## 9. 설계 검토 및 개선사항 반영

### ✅ 반영된 개선사항

1. **타임스탬프 타입 통일**
   - `created_at`, `updated_at` 모두 `timestamp with time zone`으로 통일
   - 운영/통계 시 타임존 일관성 보장

2. **RLS 정책 설계**
   - USLab 내부 관리자 전용이므로 현재 설정 유지
   - 인증된 사용자에게 모든 CRUD 권한 부여
   - 향후 필요시 author_id 기반 제약 추가 가능

3. **Phase 1 전략 결정**
   - **Phase 1부터 Novel.sh 최소 버전 사용** (Tiptap JSON 저장)
   - 마이그레이션 없이 Phase 2로 자연스럽게 확장
   - 기본 블록만 지원 (헤딩, 단락, 리스트)

4. **타입 정의 및 쿼리 구조**
   - `lib/types/blog.ts`에 `UslabPost` 인터페이스 정의
   - `lib/queries/posts.ts`에 쿼리 함수 구조화
   - Server Component에서 직접 호출 권장

5. **AI & SEO Phase 세부사항**
   - SEO 키워드 포맷: JSON 배열(string[])로 통일
   - 발행 프로세스: 초기 동기 처리, 필요시 비동기로 전환

### 📋 타입 정의 예시

```typescript
// lib/types/blog.ts
export interface UslabPost {
  id: string;
  slug: string;
  title: string;
  content: any; // Tiptap JSON
  thumbnail_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  locale: 'ko' | 'en';  // 다국어 지원
  canonical_id: string | null;  // KOR/ENG 짝 연결 (선택적)
}
```

---

## 10. i18n 라우팅 전환 전략 검토 및 개선 계획

### 10-1. 전략 평가: ✅ 서버 사이드 i18n 라우팅(/ko, /en) 전환

**현재 상태:**
- Context API + localStorage 기반 클라이언트 사이드 i18n
- URL에 언어 구분 없음 (`/`, `/blog/...`)

**전환 목표:**
- 서버 사이드 i18n 라우팅: `/ko`, `/en` URL 구조
- SEO 최적화: 구글이 언어별 페이지를 명확히 인식
- 블로그 통합: `/ko/blog/...`, `/en/blog/...` 구조로 확장 가능

**전환 이유:**
- ✅ SEO 친화적: 언어별 URL로 검색 엔진 최적화
- ✅ 블로그 통합: ICS 블로그와 자연스러운 통합
- ✅ 장기 유지보수: 명확한 구조로 확장성 확보
- ✅ 브랜딩: 연구 인사이트/블로그를 통한 SEO가 핵심 목표

---

### 10-2. 구현 관점 핵심 포인트

#### 포인트 1: `[lang]` 레이아웃 구조 - 루트 layout 유지

**⚠️ 중요: Next.js App Router에서는 root layout이 반드시 하나 있어야 함**

**올바른 구조:**
```
app/
  layout.tsx              # Root layout (html/body 포함, 그대로 유지)
  [lang]/
    layout.tsx            # 중첩 레이아웃 (html/body 없이 언어별 처리)
    page.tsx              # 랜딩 페이지
    blog/
      page.tsx            # /ko/blog, /en/blog
      [slug]/
        page.tsx          # /ko/blog/..., /en/blog/...
```

**구현 전략:**
- `app/layout.tsx`: 기본 html/body 구조 유지, 기본 lang="ko"
- `app/[lang]/layout.tsx`: 언어별 메타데이터, Provider 설정
- `generateMetadata`에서 언어별 메타데이터 동적 생성

#### 포인트 2: Middleware - 점진적 구현

**1단계: 단순 리다이렉트 (초기)**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locales = ['ko', 'en'];

  const missingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (missingLocale) {
    // 일단 기본값 ko로 리다이렉트
    return NextResponse.redirect(new URL(`/ko${pathname}`, request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**2단계: 향후 개선 (블로그 트래픽 증가 시)**
- `Accept-Language` 헤더 파싱
- localStorage 쿠키 기반 언어 선택
- 더 정교한 리다이렉트 로직

#### 포인트 3: ICS 블로그 통합 구조

**블로그 스키마 확장:**
```sql
-- uslab_posts 테이블에 locale 컬럼 추가
alter table uslab_posts add column locale text default 'ko' check (locale in ('ko', 'en'));

-- canonical_id로 KOR/ENG 짝 연결 (선택적)
alter table uslab_posts add column canonical_id uuid references uslab_posts(id);
```

**쿼리 구조:**
- `where locale = $lang` 조건 포함
- 블로그 목록: `/ko/blog`, `/en/blog`
- 블로그 상세: `/ko/blog/[slug]`, `/en/blog/[slug]`

---

### 10-3. 기존 i18n Context 재활용 전략

**현재 i18n 시스템:**
- ✅ `lib/i18n/context.tsx`: LanguageContext + Provider
- ✅ `lib/i18n/translations/ko.json`, `en.json`: 번역 파일
- ✅ localStorage, 브라우저 언어 감지

**재활용 전략:**
1. **언어의 Source of Truth: URL의 `[lang]`**
   - 서버에서 `params.lang`을 받아서 처리
2. **Context 역할 축소:**
   - 서버에서 `params.lang`을 받아서
   - 클라이언트 컴포넌트에 넘기는 "얇은 껍데기"
3. **언어 전환 방식 변경:**
   - 기존: `setLocale()` 함수로 상태 변경
   - 변경: `/ko`, `/en` 링크로 이동 (Next.js `Link` 사용)
4. **localStorage 활용:**
   - "마지막으로 본 언어" 저장
   - 미들웨어에서 `/` → `/storedLang` 리다이렉트에 활용

**구현 예시:**
```tsx
// app/[lang]/page.tsx (Server Component)
export default async function Page({ 
  params: { lang } 
}: { 
  params: { lang: 'ko' | 'en' } 
}) {
  // 서버에서 번역 파일 직접 로드
  const dict = await getDictionary(lang);

  return (
    <LanguageProvider initialLang={lang} dict={dict}>
      <HomePage />
    </LanguageProvider>
  );
}
```

---

### 10-4. 현실적인 적용 순서

**Step 1: `[lang]` 라우트 도입**
- `app/[lang]/page.tsx` 생성 (기존 `app/page.tsx` 내용 이동)
- `app/[lang]/layout.tsx` 생성 (언어별 처리)
- Root layout(`app/layout.tsx`)은 그대로 유지

**Step 2: Middleware로 `/` → `/ko` 리다이렉트**
- 단순 리다이렉트 구현
- 기본값 ko 고정

**Step 3: 기존 i18n Context를 "URL 기반"으로 재배선**
- `initialLang`를 `params.lang`으로 변경
- 언어 전환 버튼을 `/ko`, `/en` 링크로 변경
- 번역 로직은 기존 구조 재활용

**Step 4: 블로그를 `/[lang]/blog` 구조로 설계**
- Phase 1 시작할 때부터 이 구조에 맞춰서 진행
- `uslab_posts`에 `locale` 컬럼 추가

---

### 10-5. 파일 구조 변경 계획

**변경 전:**
```
app/
  layout.tsx
  page.tsx
  blog/
    page.tsx
    [slug]/page.tsx
```

**변경 후:**
```
app/
  layout.tsx              # Root layout (유지)
  [lang]/
    layout.tsx            # 언어별 레이아웃 (신규)
    page.tsx              # 랜딩 페이지 (기존 page.tsx 이동)
    blog/
      page.tsx            # 블로그 목록
      [slug]/
        page.tsx          # 블로그 상세
  middleware.ts           # 언어 리다이렉트 (신규)
```

**기존 파일 처리:**
- `app/page.tsx` → `app/[lang]/page.tsx`로 이동
- `app/layout.tsx` → Root layout으로 유지 (일부 수정)
- 컴포넌트는 대부분 변경 없음 (Context만 재배선)

---

### 10-6. 블로그 스키마 확장 계획

**⚠️ 참고: 아래 SQL은 "기존에 uslab_posts 테이블이 이미 운영 중일 때" i18n을 추가하는 마이그레이션용입니다.**

**현재 USLab 프로젝트는 블로그 테이블이 아직 없으므로, 위의 3-A 섹션의 `create table` DDL만 사용하면 됩니다.**

**기존 테이블 마이그레이션용 SQL (참고용):**
```sql
-- locale 컬럼 추가
alter table uslab_posts 
  add column locale text default 'ko' 
  check (locale in ('ko', 'en'));

-- slug unique 제약 제거 후 (locale, slug) unique 인덱스 생성
alter table uslab_posts drop constraint if exists uslab_posts_slug_key;
create unique index uslab_idx_posts_locale_slug on uslab_posts(locale, slug);

-- 인덱스 추가
create index uslab_idx_posts_locale on uslab_posts(locale, is_published, published_at desc);

-- canonical_id 추가 (KOR/ENG 짝 연결)
alter table uslab_posts 
  add column canonical_id uuid references uslab_posts(id);
create index uslab_idx_posts_canonical on uslab_posts(canonical_id);

-- 기존 데이터의 canonical_id를 id로 설정 (self 참조)
update uslab_posts set canonical_id = id where canonical_id is null;
```

**쿼리 함수 수정:**
```typescript
// lib/queries/posts.ts
export async function getPublishedPosts(lang: 'ko' | 'en', { page, limit }) {
  // locale 조건 추가
  return supabase
    .from('uslab_posts')
    .select('*')
    .eq('locale', lang)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
}

export async function getPostBySlug(lang: 'ko' | 'en', slug: string) {
  // (locale, slug) 조합으로 조회
  return supabase
    .from('uslab_posts')
    .select('*')
    .eq('locale', lang)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
}

export async function getPostAlternates(canonicalId: string) {
  // 같은 canonical_id를 가진 다른 언어 버전 조회 (hreflang용)
  return supabase
    .from('uslab_posts')
    .select('locale, slug')
    .eq('canonical_id', canonicalId)
    .eq('is_published', true);
}
```

---

### 10-7. 마이그레이션 고려사항

**기존 사용자 영향:**
- 기존 URL(`/`, `/blog/...`) → 새 URL(`/ko`, `/ko/blog/...`)로 리다이렉트
- Middleware에서 자동 처리

**SEO 영향:**
- ✅ 긍정적: 언어별 URL로 검색 엔진 최적화
- ✅ hreflang 태그 추가 가능
- ⚠️ 기존 URL 인덱싱: 301 리다이렉트로 처리

**배포 전략:**
- 블로그 Phase 1 시작 전에 i18n 라우팅 전환 완료 권장
- 또는 Phase 1과 함께 진행 (구조를 처음부터 맞추기)

---

### 10-8. 결론 및 다음 단계

**✅ 전환 결정: 서버 사이드 i18n 라우팅으로 전환**

**이유:**
- SEO 최적화 (언어별 URL)
- 블로그 통합 구조 확보
- 장기 유지보수성 향상
- 현재 시점이 전환하기 적절한 타이밍

**구현 우선순위:**
1. **i18n 라우팅 전환** (블로그 Phase 1 전 또는 함께)
2. **블로그 Phase 1** (`/[lang]/blog` 구조로 시작)

**승인 후 진행:**
- "i18n 라우팅 전환 ACT" 명령 시 Step 1-3 진행
- 또는 블로그 Phase 1과 함께 통합 진행

---

## 11. Admin 번역 워크플로우 정의

### 11-1. 포스트 생성 시 언어 선택

**언어 선택 UI:**
- `/admin/posts/write` 페이지에 언어 선택 드롭다운
- 옵션: `[한국어 (ko) | English (en)]`
- 기본값: `한국어 (ko)`
- 선택한 언어가 `locale` 컬럼에 저장됨

### 11-2. 번역 생성 워크플로우

**EN 버전이 없을 때:**
- `/admin/posts/[id]` 편집 페이지에서
- `[영문 버전 생성]` 버튼 노출
- 버튼 클릭 시:
  1. `/api/ai/translate` API 호출 (또는 `/api/ai/refine` 확장)
  2. 원본 `content` + `title`을 영어로 번역
  3. 새 row 생성:
     - `locale = 'en'`
     - `canonical_id = 원본 id`
     - `slug = 원본 slug` (또는 `slug + '-en'` if 충돌)
     - `is_published = false` (초안 상태)

**EN 버전이 있을 때:**
- "연결된 영어 버전: [편집하기]" 링크 표시
- 링크 클릭 시 `/admin/posts/[en_post_id]`로 이동

### 11-3. 슬러그 정책

**슬러그 생성 규칙:**
- 한국어: `slug = ai-prompt-engineering-guide`
- 영어: 가능한 한 같은 slug 사용 (`slug = ai-prompt-engineering-guide`)
- 충돌 시: `slug = ai-prompt-engineering-guide-en` (suffix 추가)
- **구조적으로는 `(locale, slug)` unique 인덱스로 보장되므로 문제 없음**

**예시:**
- `/ko/blog/ai-agent` → `locale='ko'`, `slug='ai-agent'`
- `/en/blog/ai-agent` → `locale='en'`, `slug='ai-agent'`
- 두 개 모두 동시에 존재 가능 (다른 locale이므로)

### 11-4. canonical_id 자동 설정 규칙

**원본(한국어) 생성 시:**
1. 포스트 row 생성
2. `canonical_id = id`로 업데이트 (self 참조)
   - 또는 트리거로 자동 설정:
   ```sql
   create or replace function uslab_set_canonical_id()
   returns trigger as $$
   begin
     if new.canonical_id is null then
       new.canonical_id = new.id;
     end if;
     return new;
   end;
   $$ language plpgsql;
   
   create trigger uslab_trigger_set_canonical_id
     before insert on uslab_posts
     for each row
     execute function uslab_set_canonical_id();
   ```

**번역(영어) 생성 시:**
- `locale = 'en'`
- `canonical_id = 원본 id` (한국어 포스트의 id)

---

## 12. SEO 및 hreflang 전략

### 12-1. generateMetadata에서 canonical_id 활용

**구현 예시:**
```typescript
// app/[lang]/blog/[slug]/page.tsx
export async function generateMetadata({ 
  params: { lang, slug } 
}: { 
  params: { lang: 'ko' | 'en', slug: string } 
}) {
  const post = await getPostBySlug(lang, slug);
  const alternates = await getPostAlternates(post.canonical_id);
  
  return {
    title: post.seo_title || post.title,
    description: post.seo_description,
    alternates: {
      languages: {
        'ko': `/ko/blog/${post.slug}`,
        'en': `/en/blog/${alternates.find(a => a.locale === 'en')?.slug || post.slug}`,
      },
    },
  };
}
```

**hreflang 태그 자동 생성:**
- 같은 `canonical_id`를 가진 포스트들을 찾아서
- 각 언어별 URL을 `alternates.languages`에 매핑
- Next.js가 자동으로 `<link rel="alternate" hreflang="ko" href="...">` 태그 생성

---

## 13. 최종 검토 및 개선사항 반영

### ✅ 반영된 최종 개선사항

1. **slug + locale 조합 정리**
   - `slug text unique` → `slug text` (unique 제거)
   - `(locale, slug)` unique 인덱스 생성
   - 같은 slug를 다른 언어에서 사용 가능

2. **canonical_id 사용 규칙 명시**
   - 원본 생성 시: `canonical_id = id` (self 참조)
   - 번역 생성 시: `canonical_id = 원본 id`
   - 트리거로 자동 설정 옵션 제공

3. **i18n 확장용 SQL 분리**
   - 10-6 섹션에 "기존 테이블이 있을 때만" 명시
   - 현재 프로젝트는 `create table` DDL만 사용

4. **Admin 번역 워크플로우 정의**
   - 포스트 생성 시 언어 선택
   - 번역 생성 버튼 및 플로우
   - 슬러그 정책 명시

5. **SEO 및 hreflang 전략**
   - `generateMetadata`에서 `canonical_id` 활용
   - `alternates.languages` 자동 생성

### 📋 최종 스키마 요약

**uslab_posts 테이블 핵심 구조:**
- `slug`: unique 아님 (locale과 조합하여 unique)
- `(locale, slug)`: unique 인덱스
- `canonical_id`: KOR/ENG 짝 연결 (자동 설정 가능)
- 모든 타임스탬프: `timestamp with time zone`

**쿼리 패턴:**
- `where locale = $lang and slug = $slug` (상세 조회)
- `where locale = $lang and is_published = true` (목록 조회)
- `where canonical_id = $id` (다른 언어 버전 조회)

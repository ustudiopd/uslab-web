# 비즈니스 로직 및 기능 동작 (Product Context)

## 1. 핵심 비즈니스 로직

### 블로그 시스템 운영 규칙

#### 발행 조건
- **발행 권한**: 관리자(authenticated 사용자 또는 uslab_admins 테이블에 등록된 사용자)
- **발행 시 자동 생성**:
  - SEO 메타데이터 (seo_title, seo_description, seo_keywords) - AI 자동 생성
  - 버전 스냅샷 (`uslab_post_versions` 테이블에 저장)
  - `published_at` 타임스탬프 자동 설정
- **발행 전 필수 조건**:
  - 제목(title) 필수
  - Slug 필수 (중복 체크: 같은 locale 내에서만)
  - 콘텐츠(content) 필수

#### Slug 정책
- **중복 규칙**: 같은 `locale` 내에서만 unique (다른 언어에서는 같은 slug 사용 가능)
- **수정 가능 여부**: 가능 (하지만 SEO 영향 고려 필요)
- **수정 시 redirect**: 향후 301 리다이렉트 구현 예정 (현재는 미구현)
- **자동 생성**: AI Slug 생성 기능 사용 가능 (`/api/ai/slug`)

#### 번역 정책
- **원문 기준**: 한국어(ko)가 원문
- **canonical_id 규칙**:
  - 한국어 원문 생성 시: `canonical_id = id` (self 참조)
  - 영어 번역 생성 시: `canonical_id = 원문 id`
  - 같은 `canonical_id`를 가진 포스트들이 하나의 "글 그룹"
- **자동 번역 기능**:
  - **Create 모드**: KO 포스트를 기반으로 EN 초안 생성
    - KO의 Tiptap JSON 구조(이미지 포함) 그대로 복제
    - 텍스트 노드만 번역하여 적용
    - 제목, SEO 제목, SEO 설명도 함께 번역
  - **Update 모드**: EN 포스트의 텍스트만 업데이트
    - 경로 기반 매칭(80% 이상): 같은 경로의 텍스트 노드만 업데이트
    - 순서 기반 fallback(50~80%): 인덱스 기반으로 매칭하여 업데이트
    - 구조 mismatch(50% 미만): 409 에러 + rebase 옵션 제시
  - **Rebase 모드**: KO 구조로 EN 완전 재생성 (EN 이미지도 KO로 변경됨)
- **번역 모델**: Gemini 2.0 Flash
- **번역 품질**:
  - 기술 용어 유지 (SOP, LLM, agent, USlab.ai, RAG, TTS, API, SDK 등)
  - 자연스러운 en-US 톤
  - 코드 블록, inline code, URL은 번역 제외
- **hreflang 태그**: `canonical_id`를 활용하여 자동 생성 (향후 구현)

#### 삭제 정책
- **Soft delete vs Hard delete**: 현재는 Hard delete (완전 삭제)
- **canonical_id FK 삭제 시나리오**: 
  - 원문(ko) 삭제 시: 번역(en)은 보존하되 그룹만 해제 (`ON DELETE SET NULL`)
  - 번역(en) 삭제 시: 원문(ko)은 영향 없음
- **버전 관리**: 삭제된 포스트의 버전도 함께 삭제 (`ON DELETE CASCADE`)

#### 댓글 정책
- **작성 권한**: 누구나 작성 가능 (공개)
- **승인 정책**: 기본적으로 `is_approved = true` (자동 승인)
- **수정/삭제**: 비밀번호 확인 후 가능 (API 레벨에서 검증)
- **표시 정책**: 승인된 댓글만 공개 표시

## 2. 주요 기능별 동작 시나리오

### [기능 1: 블로그 포스트 작성 및 발행]
1. 관리자가 `/admin/posts/write` 접속
2. 제목 입력 → AI Slug 생성 (선택적)
3. Novel.sh 에디터로 콘텐츠 작성
4. 초안 저장 또는 발행 선택
   - **초안 저장**: `is_published = false`, `published_at = NULL`
   - **발행**: 
     - AI SEO 메타데이터 자동 생성
     - 버전 스냅샷 저장
     - `is_published = true`, `published_at = now()` 설정
     - 포스트 저장

### [기능 2: 블로그 포스트 수정]
1. 관리자가 `/admin/posts/[id]` 접속
2. 기존 포스트 로드 (draft 포함, authenticated 사용자는 모든 포스트 조회 가능)
3. 콘텐츠 수정
4. AI 교정 기능 사용 시:
   - 교정 전 버전 스냅샷 자동 저장
   - AI 교정 결과 표시 (DiffView)
   - 수락/거절 선택
5. 저장 또는 발행

### [기능 3: AI 기능 사용]
1. **AI 이어쓰기** (`/api/ai/generate`):
   - 관리자 인증 확인
   - Streaming 응답으로 실시간 텍스트 생성
   - 에디터에 자동 삽입

2. **AI 교정** (`/api/ai/refine`):
   - 관리자 인증 확인
   - 교정 전 버전 스냅샷 저장
   - AI 교정 결과 반환 (원본/제안/이유)
   - 사용자가 수락/거절 선택

3. **SEO 자동 생성** (`/api/ai/seo`):
   - 관리자 인증 확인
   - 발행 시 자동 호출 (편집/작성 페이지에서 통합)
   - locale에 따라 한국어/영어 프롬프트 분기
   - SEO 메타데이터 생성 (seo_title, seo_description, seo_keywords)
   - 파싱 실패 시 fallback 전략 (제목/본문에서 추출)
   - 생성 실패해도 발행은 정상 진행 (페이지 레벨 fallback 사용)

### [기능 4: 댓글 작성 및 관리]
1. 사용자가 블로그 포스트 페이지에서 댓글 작성
2. 이름, 비밀번호, 댓글 내용 입력
3. 댓글 저장 (자동 승인)
4. 댓글 수정/삭제: 비밀번호 확인 후 가능

### [기능 6: 블로그 에디터 서식 기능]
1. **버블 메뉴 (텍스트 선택 시)**:
   - Bold (굵게): `Ctrl/Cmd + B`
   - Italic (기울임): `Ctrl/Cmd + I`
   - Underline (밑줄): `Ctrl/Cmd + U`
   - Strikethrough (취소선): `Ctrl/Cmd + Shift + X`
   - Code (인라인 코드): `Ctrl/Cmd + E`
   - Small (작은 글씨): 버블 메뉴에서 Type 아이콘 클릭 또는 `Ctrl/Cmd + Shift + S`

2. **슬래시 커맨드 (`/` 입력 시)**:
   - Text, Heading 1-3, Bullet List, Numbered List, To-do List, Quote, Code 블록

3. **링크 기능**:
   - 본문의 URL 텍스트는 자동으로 클릭 가능한 링크로 변환
   - 모든 링크는 새창에서 열림 (`target="_blank"`)
   - 보안을 위해 `rel="noopener noreferrer"` 자동 적용

4. **이미지 기능**:
   - 이미지 클릭 시 전체화면 라이트박스 모달 표시
   - ESC 키 또는 닫기 버튼으로 모달 닫기
   - 배경 클릭으로도 모달 닫기 가능

### [기능 5: 다국어 포스트 관리]
1. 한국어 원문 작성 및 발행
2. 영어 번역 생성 시:
   - 원문의 `canonical_id`를 `canonical_id`로 설정
   - 같은 slug 사용 가능 (locale이 다르므로)
3. hreflang 태그 자동 생성 (향후 구현)

### [기능 6: 블로그 조회수 추적]
1. 사용자가 블로그 포스트 페이지 접속
2. `PostViewer` 컴포넌트 마운트 시 자동으로 조회수 증가 API 호출
   - `/api/posts/[id]/view` (POST)
   - 발행된 포스트(`is_published = true`)만 조회수 증가
   - 중복 증가 방지 (useRef로 한 번만 실행)
3. `uslab_increment_view_count` 함수 실행
   - 원자적 증가 (동시성 문제 방지)
   - 업데이트된 조회수 반환
4. 조회수 UI 표시
   - 발행일 옆에 조회수 아이콘 및 숫자 표시
   - 천 단위 구분 표시 (toLocaleString)

## 3. 데이터 일관성 규칙

### published_at/is_published 일관성
- `is_published = true` → `published_at` 반드시 존재
- `is_published = false` → `published_at = NULL`
- DB 레벨에서 체크 제약조건 또는 트리거로 보장

### canonical_id 규칙
- 원문 생성 시: `canonical_id = id` (트리거로 자동 설정)
- 번역 생성 시: `canonical_id = 원문 id` (수동 설정)
- 원문 삭제 시: 번역의 `canonical_id = NULL` (FK 제약조건)

### 요약(excerpt) 전략
- PostCard 요약: `seo_description` 재사용
- 별도 `excerpt` 컬럼 없음 (SEO와 일관성 유지)

## 4. 보안 및 권한 규칙

### RLS (Row Level Security) 정책
- **공개 읽기**: `is_published = true`인 포스트만
- **인증된 사용자 읽기**: 모든 포스트 조회 가능 (draft 포함)
- **인증된 사용자 쓰기**: INSERT, UPDATE, DELETE 가능
- **버전 관리**: 인증된 사용자만 조회/작성 가능

### 관리자 권한 모델
- **현재 방식**: authenticated 사용자 = 관리자
- **향후 개선**: `uslab_admins` 테이블 또는 회원가입 비활성화

### AI API 보안
- 모든 AI 엔드포인트는 관리자 인증 필수
- 비용/남용 리스크 방지













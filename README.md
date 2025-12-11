# USLab.ai

USLab AI 연구 및 개발 플랫폼 웹사이트

## 프로젝트 개요

USLab.ai는 AI 연구 및 개발 성과를 공유하는 플랫폼입니다. ustudio.co.kr과 같은 Supabase 프로젝트를 공유하지만, 완전히 분리된 스키마 구조를 사용합니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 스키마 분리 전략

이 프로젝트는 `uslab_` prefix를 사용하여 모든 데이터베이스 객체를 명명합니다:

- **테이블**: `uslab_projects`, `uslab_posts`, `uslab_inquiries` 등
- **함수**: `uslab_update_updated_at` 등
- **트리거**: `uslab_trigger_name` 등
- **RLS 정책**: `uslab_policy_name` 등
- **인덱스**: `uslab_index_name` 등

이를 통해 ustudio 프로젝트(`ustudio_` prefix)와 완전히 분리된 스키마를 유지합니다.

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 서버 사이드 전용
```

## 개발 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 개발 서버 실행
npm run dev
```

서버가 실행되면 `http://localhost:3000`에서 확인할 수 있습니다.

## 데이터베이스 마이그레이션

Supabase MCP를 사용하여 마이그레이션을 적용할 수 있습니다:

```bash
# 마이그레이션 파일이 supabase/migrations/ 디렉토리에 있습니다
# Supabase MCP를 통해 적용하세요
```

## 프로젝트 구조

```
uslab-web/
├── app/                    # Next.js App Router 페이지
├── components/             # React 컴포넌트
├── lib/
│   ├── supabase/          # Supabase 클라이언트 설정
│   ├── queries/           # 데이터베이스 쿼리 함수
│   └── types/             # TypeScript 타입 정의
├── memory_bank/           # 프로젝트 문서 (메모리 뱅크)
├── supabase/
│   └── migrations/        # 데이터베이스 마이그레이션 파일
└── public/                # 정적 파일
```

## 메모리 뱅크

프로젝트 컨텍스트는 `memory_bank/` 디렉토리에 문서화되어 있습니다:

- `projectbrief.md`: 프로젝트 개요 및 목표
- `techContext.md`: 기술 스택 정보
- `systemPatterns.md`: 아키텍처 패턴 및 코딩 규칙
- `productContext.md`: 비즈니스 로직 및 기능 동작
- `activeContext.md`: 현재 작업 상황
- `progress.md`: 완료된 작업 내역

## 라이선스

MIT


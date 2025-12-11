# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: USLab.ai 프로젝트 스키마 분리 및 기반 설정
- **목표**: ustudio와 uslab 프로젝트가 같은 Supabase를 공유하면서 완전히 분리된 스키마 구조 구축
- **담당자**: AI Assistant + 사용자
- **상태**: 🚧 진행 중

## 2. 최근 완료된 작업
- ✅ Plan/Act 워크플로우 초기화
- ✅ 메모리 뱅크 문서 업데이트 (projectbrief, techContext, systemPatterns)
- ✅ 스키마 분리 전략 수립 (`uslab_` prefix 기반)

## 3. 다음 예정 작업  
- **Phase 1: 기반 설정** (진행 중)
  - Supabase 클라이언트 설정 (`lib/supabase/client.ts`)
  - 쿼리 헬퍼 함수 생성 (`lib/queries/`)
  - 타입 정의 구조 생성 (`lib/types/uslab.ts`)
  - 마이그레이션 디렉토리 구조 생성
- **Phase 2: 스키마 설계** (다음 단계)
  - 필요한 테이블 목록 정의
  - RLS 정책 설계
  - 인덱스 설계
- **Phase 3: 마이그레이션 작성** (다음 단계)
  - 마이그레이션 파일 생성
  - 테스트 및 검증

## 4. 주요 이슈 및 블로커  
- 현재 블로커 없음
- 스키마 분리 전략 확정: `uslab_` prefix 사용 (ustudio의 `ustudio_` 패턴과 동일)
- Supabase 프로젝트 공유 확인: gzguucdzsrfypbkqlyku


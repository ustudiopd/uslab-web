# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: USLab.ai 웹사이트 배포 및 운영 준비
- **목표**: Vercel 배포 완료 및 Supabase 마이그레이션 적용
- **담당자**: AI Assistant + 사용자
- **상태**: ✅ 기본 구축 완료, 배포 대기 중

## 2. 최근 완료된 작업 (2024-12-20)
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

## 3. 다음 예정 작업  
- **Supabase 마이그레이션 적용** (우선순위 높음)
  - `uslab_inquiries` 테이블 생성 (Supabase MCP 사용)
  - RLS 정책 검증
- **배포 후 검증** (다음 단계)
  - Vercel 배포 확인
  - 문의 폼 동작 테스트
  - 반응형 디자인 검증
- **추가 기능 개발** (향후)
  - 포트폴리오 데이터 Supabase 연동
  - 프로젝트/포스트 테이블 생성
  - 관리자 대시보드 (선택적)

## 4. 주요 이슈 및 블로커  
- 현재 블로커 없음
- 스키마 분리 전략 확정: `uslab_` prefix 사용 (ustudio의 `ustudio_` 패턴과 동일)
- Supabase 프로젝트 공유 확인: gzguucdzsrfypbkqlyku


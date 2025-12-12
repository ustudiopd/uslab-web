# 어드민 페이지 사용 가이드

## 어드민 계정 생성

### 방법 1: 스크립트 사용 (권장)

```bash
# 환경 변수 확인 (.env.local에 SUPABASE_SERVICE_ROLE_KEY가 있어야 함)
npx tsx scripts/create-admin-user.ts
```

또는 Node.js 환경에서:

```bash
node -r ts-node/register scripts/create-admin-user.ts
```

### 방법 2: Supabase Dashboard 사용

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (ustudio - gzguucdzsrfypbkqlyku)
3. Authentication > Users 메뉴로 이동
4. "Add user" 클릭
5. 다음 정보 입력:
   - **Email**: `admin@uslab.ai`
   - **Password**: `uslabai@82`
   - **Auto Confirm User**: 체크 (이메일 확인 없이 바로 활성화)

## 로그인

1. 브라우저에서 `/admin/login` 접속
2. 다음 정보로 로그인:
   - **이메일**: `admin@uslab.ai`
   - **비밀번호**: `uslabai@82`

## 어드민 페이지 경로

- **로그인**: `/admin/login`
- **포스트 목록**: `/admin/posts`
- **새 포스트 작성**: `/admin/posts/write`
- **포스트 편집**: `/admin/posts/[id]`

## 보안 주의사항

⚠️ **중요**: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!

## 문제 해결

### 로그인이 안 될 때

1. Supabase Dashboard에서 사용자가 생성되었는지 확인
2. 사용자의 `email_confirmed_at` 필드가 설정되어 있는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 권한 오류가 발생할 때

1. RLS 정책이 올바르게 설정되었는지 확인
2. 사용자가 `authenticated` 역할을 가지고 있는지 확인




/**
 * 어드민 사용자 생성 스크립트
 * 
 * 사용법:
 * npx tsx scripts/create-admin-user.ts
 * 
 * 또는 Node.js 환경에서:
 * node -r ts-node/register scripts/create-admin-user.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = 'admin@uslab.ai';
  const password = 'uslabai@82';

  try {
    // 사용자가 이미 존재하는지 확인
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find((u) => u.email === email);

    if (existingUser) {
      console.log('✅ 사용자가 이미 존재합니다.');
      console.log(`   이메일: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log('\n비밀번호를 변경하려면 Supabase Dashboard에서 수동으로 변경하세요.');
      return;
    }

    // 새 사용자 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 없이 바로 활성화
      user_metadata: {
        username: 'admin',
        role: 'admin',
      },
    });

    if (error) {
      console.error('❌ 사용자 생성 실패:', error.message);
      process.exit(1);
    }

    console.log('✅ 어드민 사용자가 성공적으로 생성되었습니다!');
    console.log(`   이메일: ${data.user.email}`);
    console.log(`   ID: ${data.user.id}`);
    console.log('\n로그인 정보:');
    console.log(`   이메일: ${email}`);
    console.log(`   비밀번호: ${password}`);
    console.log('\n⚠️  보안을 위해 로그인 후 비밀번호를 변경하는 것을 권장합니다.');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createAdminUser();


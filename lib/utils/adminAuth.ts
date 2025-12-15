/**
 * 운영진 보드 API 인증 헬퍼
 * Bearer 토큰에서 사용자 정보를 추출하고 운영진 여부를 확인
 */

import { createServerClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Bearer 토큰에서 사용자 정보 추출 및 운영진 확인
 */
export async function verifyAdminAuth(
  authHeader: string | null
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized: Missing or invalid token' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createServerClient();

  try {
    // 토큰에서 사용자 정보 추출
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return { user: null, error: 'Unauthorized: Invalid token' };
    }

    // 운영진 여부 확인
    const { data: adminCheck, error: adminError } = await supabase
      .from('uslab_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck) {
      return { user: null, error: 'Forbidden: Admin access required' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { user: null, error: 'Internal server error during authentication' };
  }
}


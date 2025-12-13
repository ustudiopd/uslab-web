/**
 * Supabase 클라이언트 설정
 * 
 * USLab.ai 프로젝트 전용 Supabase 클라이언트
 * - 스키마: uslab_ prefix 사용
 * - 프로젝트 ID: gzguucdzsrfypbkqlyku (ustudio와 공유)
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/uslab';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Supabase 클라이언트 인스턴스
 * 
 * @example
 * ```ts
 * import { supabase } from '@/lib/supabase/client';
 * const { data } = await supabase.from('uslab_projects').select('*');
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * 서버 사이드에서 사용할 Supabase 클라이언트
 * (서비스 롤 키 사용, 필요시)
 */
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};













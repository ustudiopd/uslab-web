/**
 * 소개 페이지 쿼리 함수
 * Supabase를 사용하여 uslab_about 테이블에 접근
 * 
 * Server Component에서 사용할 때는 createServerClient()를 사용
 * Client Component에서 사용할 때는 supabase를 사용
 */

import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/client';
import type { UslabAbout, UpdateAboutData } from '@/lib/types/about';
import type { Locale } from '@/lib/i18n/config';

// Server Component용 Supabase 클라이언트 생성
function getServerSupabase() {
  try {
    return createServerClient();
  } catch {
    // 서비스 롤 키가 없으면 일반 클라이언트 사용 (RLS 정책에 따라)
    return supabase;
  }
}

/**
 * locale로 소개 페이지 조회
 * Server Component에서 사용
 */
export async function getAboutByLocale(locale: Locale): Promise<UslabAbout | null> {
  const client = getServerSupabase();
  const { data, error } = await (client
    .from('uslab_about') as any)
    .select('*')
    .eq('locale', locale)
    .single();

  if (error) {
    console.error('Error fetching about:', error);
    return null;
  }

  return data as UslabAbout;
}

/**
 * 소개 페이지 수정
 * Client Component에서 사용 (인증 필요)
 */
export async function updateAbout(locale: Locale, data: UpdateAboutData): Promise<UslabAbout | null> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user?.user) {
    throw new Error('User not authenticated');
  }

  // locale로 기존 레코드 찾기
  const { data: existing } = await (supabase
    .from('uslab_about') as any)
    .select('id')
    .eq('locale', locale)
    .single();

  if (existing) {
    // 업데이트
    const { data: about, error } = await (supabase
      .from('uslab_about') as any)
      .update(data)
      .eq('locale', locale)
      .select()
      .single();

    if (error) {
      console.error('Error updating about:', error);
      return null;
    }

    return about as UslabAbout;
  } else {
    // 생성 (없는 경우)
    const { data: about, error } = await (supabase
      .from('uslab_about') as any)
      .insert({
        locale,
        ...data,
        author_id: user.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating about:', error);
      return null;
    }

    return about as UslabAbout;
  }
}

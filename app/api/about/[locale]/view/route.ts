import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Locale } from '@/lib/i18n/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RouteParams {
  params: Promise<{ locale: string }>;
}

// POST: 소개 페이지 조회수 증가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { locale } = await params;

    if (!locale || (locale !== 'ko' && locale !== 'en')) {
      return NextResponse.json(
        { error: 'Invalid locale. Must be "ko" or "en"' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성 (anon key 사용 - 공개 API)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // locale로 소개 페이지 찾기
    const { data: about, error: fetchError } = await supabase
      .from('uslab_about')
      .select('id')
      .eq('locale', locale)
      .single();

    if (fetchError || !about) {
      // 소개 페이지가 없으면 조회수 증가하지 않음
      return NextResponse.json({
        success: true,
        view_count: 0,
      });
    }

    // 조회수 증가 함수 호출
    // @ts-ignore - RPC 함수 타입이 자동 생성되지 않아 임시로 타입 체크 비활성화
    const { data, error } = await supabase.rpc('uslab_increment_about_view_count', {
      about_id: about.id,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      return NextResponse.json(
        { error: 'Failed to increment view count', details: error.message },
        { status: 500 }
      );
    }

    // 성공 응답 (조회수 반환)
    return NextResponse.json({
      success: true,
      view_count: data || 0,
    });
  } catch (error) {
    console.error('Error in view count increment:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAboutByLocale } from '@/lib/queries/about';
import type { UpdateAboutData } from '@/lib/types/about';
import type { Locale } from '@/lib/i18n/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET: 소개 페이지 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'ko') as Locale;

    const about = await getAboutByLocale(locale);
    
    // about가 없어도 200 OK 반환 (404 대신 null 반환)
    // 클라이언트에서 정상적으로 처리할 수 있도록
    return NextResponse.json({ about: about || null });
  } catch (error) {
    console.error('Error fetching about:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about page' },
      { status: 500 }
    );
  }
}

// PUT: 소개 페이지 수정
export async function PUT(request: Request) {
  try {
    // 인증 토큰 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Bearer 토큰 추출
    const token = authHeader.replace('Bearer ', '');

    // 인증 확인용 클라이언트 (anon key 사용)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 사용자 인증 확인 (토큰으로 사용자 정보 가져오기)
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'User not authenticated', details: authError?.message },
        { status: 401 }
      );
    }

    // 데이터베이스 작업용 클라이언트
    let supabase;
    
    if (supabaseServiceRoleKey) {
      // 서비스 롤 키 사용 (RLS 우회)
      supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      // 서비스 롤 키가 없으면 인증된 세션으로 작업
      const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return NextResponse.json(
          { 
            error: 'Failed to set session',
            details: sessionError.message,
            hint: 'SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다. .env.local에 추가하세요.',
          },
          { status: 500 }
        );
      }

      supabase = authClient;
    }

    const body: UpdateAboutData & { locale: Locale } = await request.json();

    // 필수 필드 검증
    if (!body.content || !body.locale) {
      return NextResponse.json(
        { error: 'Missing required fields: content, locale' },
        { status: 400 }
      );
    }

    // locale로 기존 레코드 찾기
    const { data: existing, error: checkError } = await supabase
      .from('uslab_about')
      .select('id')
      .eq('locale', body.locale)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking about:', checkError);
      return NextResponse.json(
        { error: 'Failed to check about page', details: checkError.message },
        { status: 500 }
      );
    }

    let about;

    if (existing) {
      // 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('uslab_about')
        .update({ content: body.content })
        .eq('locale', body.locale)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating about:', updateError);
        return NextResponse.json(
          { 
            error: 'Failed to update about page',
            details: updateError.message,
            code: updateError.code,
          },
          { status: 500 }
        );
      }

      about = updated;
    } else {
      // 생성 (없는 경우)
      const { data: created, error: insertError } = await supabase
        .from('uslab_about')
        .insert({
          locale: body.locale,
          content: body.content,
          author_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating about:', insertError);
        return NextResponse.json(
          { 
            error: 'Failed to create about page',
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 }
        );
      }

      about = created;
    }

    return NextResponse.json({ about }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error('Error updating about:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update about page',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

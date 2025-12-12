import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllPosts, getPublishedPosts } from '@/lib/queries/posts';
import type { CreatePostData, UslabPost } from '@/lib/types/blog';
import type { Locale } from '@/lib/i18n/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET: 포스트 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') || 'ko') as Locale;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const all = searchParams.get('all') === 'true'; // Admin용: 모든 포스트 조회

    if (all) {
      // Admin용: 모든 포스트 (발행/초안 모두)
      const posts = await getAllPosts(lang);
      return NextResponse.json({ posts });
    } else {
      // 공개용: 발행된 포스트만
      const result = await getPublishedPosts(lang, { page, limit });
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST: 새 포스트 생성
export async function POST(request: Request) {
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
    // 서비스 롤 키가 있으면 사용 (RLS 우회), 없으면 인증된 세션으로 작업
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
      // 세션 설정 (RLS 정책이 인증된 사용자를 인식하도록)
      const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
        access_token: token,
        refresh_token: '', // API 라우트에서는 refresh token이 필요 없음
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

    const body: CreatePostData = await request.json();

    // 필수 필드 검증
    if (!body.slug || !body.title || !body.content || !body.locale) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content, locale' },
        { status: 400 }
      );
    }

    // 인증된 클라이언트로 포스트 생성 (세션 설정 후)
    const { data: post, error: insertError } = await supabase
      .from('uslab_posts')
      .insert({
        ...body,
        author_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating post:', insertError);
      
      // RLS 정책 위반인 경우 더 명확한 메시지 제공
      if (insertError.code === '42501' || insertError.message.includes('row-level security')) {
        return NextResponse.json(
          { 
            error: 'Failed to create post',
            details: insertError.message,
            code: insertError.code,
            hint: supabaseServiceRoleKey 
              ? '서비스 롤 키가 유효하지 않을 수 있습니다. .env.local의 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.'
              : 'RLS 정책 위반. SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가하거나, RLS 정책을 확인하세요.',
          },
          { status: 500 }
        );
      }
      
      // Invalid API key 오류인 경우
      if (insertError.message.includes('Invalid API key') || insertError.code === 'PGRST301') {
        return NextResponse.json(
          { 
            error: 'Invalid API key',
            details: insertError.message,
            code: insertError.code,
            hint: supabaseServiceRoleKey
              ? '서비스 롤 키가 잘못되었습니다. Supabase 대시보드에서 올바른 서비스 롤 키를 확인하세요.'
              : '서비스 롤 키가 설정되지 않았습니다. .env.local에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.',
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create post',
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: post as UslabPost }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create post',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}




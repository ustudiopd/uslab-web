import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updatePost, deletePost } from '@/lib/queries/posts';
import type { UpdatePostData, UslabPost } from '@/lib/types/blog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 포스트 상세 조회 (초안 포함)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // 서비스 롤 키가 있으면 사용 (RLS 우회하여 초안도 조회 가능)
    const supabase = supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : createClient(supabaseUrl, supabaseAnonKey);

    // 포스트 조회 (초안 포함)
    const { data: post, error } = await supabase
      .from('uslab_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return NextResponse.json(
        { error: 'Post not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: post as UslabPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT: 포스트 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // 인증 토큰 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 인증 확인용 클라이언트
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body: UpdatePostData = await request.json();

    // 서비스 롤 키로 업데이트 (RLS 우회)
    const supabase = supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : authClient;

    // slug가 변경되는 경우 중복 체크 (현재 포스트 제외)
    if (body.slug && body.locale) {
      const { data: existingPost, error: checkError } = await supabase
        .from('uslab_posts')
        .select('id, slug, locale, title')
        .eq('slug', body.slug)
        .eq('locale', body.locale)
        .neq('id', id) // 현재 포스트는 제외
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking slug:', checkError);
      }

      if (existingPost) {
        return NextResponse.json(
          { 
            error: 'Slug already exists',
            details: `같은 언어(${body.locale})에서 slug "${body.slug}"가 이미 사용 중입니다.`,
            code: 'DUPLICATE_SLUG',
            existingPost: {
              id: existingPost.id,
              slug: existingPost.slug,
              locale: existingPost.locale,
              title: existingPost.title,
            },
            hint: '다른 slug를 사용하거나 기존 포스트를 수정하세요.',
          },
          { status: 409 } // Conflict
        );
      }
    }

    const { data: post, error: updateError } = await supabase
      .from('uslab_posts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !post) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: post as UslabPost });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE: 포스트 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // 인증 토큰 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 인증 확인용 클라이언트
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // 서비스 롤 키로 삭제 (RLS 우회)
    const supabase = supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : authClient;

    const { error: deleteError } = await supabase
      .from('uslab_posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}





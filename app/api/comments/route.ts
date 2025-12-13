import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { CreateCommentData, UslabComment } from '@/lib/types/blog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// uslab_posts API와 동일한 방식으로 클라이언트 생성

// 비밀번호 해시 생성 (SHA-256)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// GET: 포스트의 댓글 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    // uslab_posts와 동일한 방식으로 클라이언트 생성 및 쿼리
    // service_role 키 사용 (RLS 우회)
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // uslab_posts와 동일한 방식으로 쿼리 실행 (타입 캐스팅 사용)
    // lib/queries/posts.ts에서 사용하는 방식과 동일
    const { data: comments, error } = await (supabase
      .from('uslab_comments') as any)
      .select('id, post_id, author_name, content, created_at, updated_at')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch comments', 
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch comments',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: 댓글 작성
export async function POST(request: Request) {
  try {
    const body: CreateCommentData = await request.json();

    if (!body.post_id || !body.author_name || !body.password || !body.content) {
      return NextResponse.json(
        { error: 'post_id, author_name, password, and content are required' },
        { status: 400 }
      );
    }

    // 비밀번호 해시 생성
    const passwordHash = hashPassword(body.password);

    // service_role 키를 명시적으로 사용 (uslab_posts와 동일한 방식)
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // uslab_posts와 동일한 방식으로 삽입 (타입 캐스팅 사용)
    const { data: comment, error } = await (supabase
      .from('uslab_comments') as any)
      .insert({
        post_id: body.post_id,
        author_name: body.author_name.trim(),
        password_hash: passwordHash,
        content: body.content.trim(),
        is_approved: true,
      })
      .select('id, post_id, author_name, content, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating comment:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create comment', 
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create comment',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}




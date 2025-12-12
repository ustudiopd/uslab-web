import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { UpdateCommentData, DeleteCommentData, UslabComment } from '@/lib/types/blog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// uslab_posts API와 동일한 방식으로 클라이언트 생성

// 비밀번호 해시 생성 (SHA-256)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// 비밀번호 확인
async function verifyPassword(
  commentId: string,
  password: string
): Promise<boolean> {
  try {
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
      return false;
    }

    // uslab_posts와 동일한 방식으로 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 타입 캐스팅 사용 (uslab_posts와 동일)
    const { data: comment, error } = await (supabase
      .from('uslab_comments') as any)
      .select('password_hash')
      .eq('id', commentId)
      .single();

    if (error || !comment) {
      return false;
    }

    const passwordHash = hashPassword(password);
    return comment.password_hash === passwordHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: 댓글 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateCommentData & { password: string } = await request.json();

    if (!body.password || !body.content) {
      return NextResponse.json(
        { error: 'password and content are required' },
        { status: 400 }
      );
    }

    // 비밀번호 확인
    const isValid = await verifyPassword(id, body.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // uslab_posts와 동일한 방식으로 업데이트
    if (!supabaseServiceRoleKey) {
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

    const { data: comment, error } = await (supabase
      .from('uslab_comments') as any)
      .update({
        content: body.content.trim(),
      })
      .eq('id', id)
      .select('id, post_id, author_name, content, created_at, updated_at')
      .single();

    if (error || !comment) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment', details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE: 댓글 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: DeleteCommentData = await request.json();

    if (!body.password) {
      return NextResponse.json(
        { error: 'password is required' },
        { status: 400 }
      );
    }

    // 비밀번호 확인
    const isValid = await verifyPassword(id, body.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // uslab_posts와 동일한 방식으로 삭제
    if (!supabaseServiceRoleKey) {
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

    const { error } = await (supabase
      .from('uslab_comments') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}



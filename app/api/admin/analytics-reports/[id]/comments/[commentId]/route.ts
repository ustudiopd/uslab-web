import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';

/**
 * PUT /api/admin/analytics-reports/[id]/comments/[commentId]
 * 
 * 보고서 댓글 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const prefix = ANALYTICS_PREFIX;
    const commentsTable = `${prefix}_analytics_report_comments`;

    // 댓글 소유권 확인
    const { data: comment, error: fetchError } = await (supabase as any)
      .from(commentsTable)
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own comments' },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedComment, error } = await (supabase as any)
      .from(commentsTable)
      .update({
        content: content.trim(),
      })
      .eq('id', commentId)
      .select('id, report_id, user_id, user_email, author_name, content, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/analytics-reports/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/analytics-reports/[id]/comments/[commentId]
 * 
 * 보고서 댓글 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const prefix = ANALYTICS_PREFIX;
    const commentsTable = `${prefix}_analytics_report_comments`;

    // 댓글 소유권 확인
    const { data: comment, error: fetchError } = await (supabase as any)
      .from(commentsTable)
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own comments' },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error } = await (supabase as any)
      .from(commentsTable)
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/analytics-reports/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


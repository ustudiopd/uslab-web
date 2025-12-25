import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';

/**
 * GET /api/admin/analytics-reports/[id]/comments
 * 
 * 보고서 댓글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const prefix = ANALYTICS_PREFIX;
    const commentsTable = `${prefix}_analytics_report_comments`;

    // 댓글 목록 조회
    const { data: comments, error } = await (supabase as any)
      .from(commentsTable)
      .select('id, report_id, user_id, user_email, author_name, content, created_at, updated_at')
      .eq('report_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/analytics-reports/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/analytics-reports/[id]/comments
 * 
 * 보고서 댓글 작성
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { content, authorName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const prefix = ANALYTICS_PREFIX;
    const commentsTable = `${prefix}_analytics_report_comments`;

    // 보고서 존재 확인
    const reportsTable = `${prefix}_analytics_reports`;
    const { data: report, error: reportError } = await (supabase as any)
      .from(reportsTable)
      .select('id')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // 댓글 작성
    const { data: comment, error } = await (supabase as any)
      .from(commentsTable)
      .insert({
        report_id: id,
        user_id: user.id,
        user_email: user.email,
        author_name: authorName || user.email?.split('@')[0] || '관리자',
        content: content.trim(),
      })
      .select('id, report_id, user_id, user_email, author_name, content, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/analytics-reports/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


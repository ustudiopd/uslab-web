import { NextRequest, NextResponse } from 'next/server';
import { getDocsByBoardId, createDoc } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { CreateDocData } from '@/lib/types/execBoard';

/**
 * GET /api/admin/exec-boards/[boardId]/docs
 * 보드의 문서 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { boardId } = await params;
    const { searchParams } = new URL(request.url);
    const includeTrashed = searchParams.get('trashed') === 'true';

    const docs = await getDocsByBoardId(boardId, includeTrashed);

    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Error fetching docs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch docs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/exec-boards/[boardId]/docs
 * 문서 생성
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { boardId } = await params;
    const body: CreateDocData = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const doc = await createDoc(boardId, body, user.id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Failed to create doc' },
        { status: 500 }
      );
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error creating doc:', error);
    return NextResponse.json(
      { error: 'Failed to create doc' },
      { status: 500 }
    );
  }
}


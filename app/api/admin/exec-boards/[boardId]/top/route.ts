import { NextRequest, NextResponse } from 'next/server';
import { getTopDocByBoardId } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/exec-boards/[boardId]/top
 * 보드의 최상단 문서 조회 (1등 문서)
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

    const doc = await getTopDocByBoardId(boardId);

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error fetching top doc:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top doc' },
      { status: 500 }
    );
  }
}


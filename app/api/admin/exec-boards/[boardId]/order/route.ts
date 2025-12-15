import { NextRequest, NextResponse } from 'next/server';
import { reorderDocs } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { ReorderDocsData } from '@/lib/types/execBoard';

/**
 * PATCH /api/admin/exec-boards/[boardId]/order
 * 문서 정렬 (priority 재계산)
 */
export async function PATCH(
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
    const body: ReorderDocsData = await request.json();

    if (!body.orderedDocIds || !Array.isArray(body.orderedDocIds)) {
      return NextResponse.json(
        { error: 'orderedDocIds array is required' },
        { status: 400 }
      );
    }

    const success = await reorderDocs(boardId, body.orderedDocIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder docs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: body.orderedDocIds.length,
    });
  } catch (error) {
    console.error('Error reordering docs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder docs' },
      { status: 500 }
    );
  }
}


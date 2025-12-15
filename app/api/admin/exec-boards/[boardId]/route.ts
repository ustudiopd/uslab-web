import { NextRequest, NextResponse } from 'next/server';
import { updateBoard, deleteBoard } from '@/lib/queries/execBoards';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { UpdateBoardData } from '@/lib/types/execBoard';

/**
 * PATCH /api/admin/exec-boards/[boardId]
 * 보드 수정
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
    const body: UpdateBoardData = await request.json();

    const board = await updateBoard(boardId, body, user.id);

    if (!board) {
      return NextResponse.json(
        { error: 'Failed to update board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/exec-boards/[boardId]
 * 보드 삭제 (주의: 문서도 cascade 삭제됨)
 */
export async function DELETE(
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

    const success = await deleteBoard(boardId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    );
  }
}


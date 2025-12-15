import { NextRequest, NextResponse } from 'next/server';
import { getAllBoards, createBoard } from '@/lib/queries/execBoards';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { CreateBoardData } from '@/lib/types/execBoard';

/**
 * GET /api/admin/exec-boards
 * 보드 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const boards = await getAllBoards();

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/exec-boards
 * 보드 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const body: CreateBoardData = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const board = await createBoard(body, user.id);

    if (!board) {
      return NextResponse.json(
        { error: 'Failed to create board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
}


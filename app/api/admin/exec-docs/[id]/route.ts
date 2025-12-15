import { NextRequest, NextResponse } from 'next/server';
import { getDocById, updateDoc } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { UpdateDocData } from '@/lib/types/execBoard';

/**
 * GET /api/admin/exec-docs/[id]
 * 문서 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인 (조회는 운영진만 가능)
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { id } = await params;

    const doc = await getDocById(id);

    if (!doc) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error fetching doc:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doc' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/exec-docs/[id]
 * 문서 수정 (자동저장 시 사용)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { id } = await params;
    const body: UpdateDocData = await request.json();

    const doc = await updateDoc(id, body, user.id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Failed to update doc' },
        { status: 500 }
      );
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error updating doc:', error);
    return NextResponse.json(
      { error: 'Failed to update doc' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/exec-docs/[id]
 * 문서 삭제 (soft delete - 휴지통으로 이동)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { id } = await params;

    // soft delete로 처리
    const doc = await updateDoc(
      id,
      {
        is_trashed: true,
      },
      user.id
    );

    if (!doc) {
      return NextResponse.json(
        { error: 'Failed to delete doc' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting doc:', error);
    return NextResponse.json(
      { error: 'Failed to delete doc' },
      { status: 500 }
    );
  }
}


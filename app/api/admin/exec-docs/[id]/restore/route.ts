import { NextRequest, NextResponse } from 'next/server';
import { restoreDoc } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * POST /api/admin/exec-docs/[id]/restore
 * 문서 복원 (휴지통에서)
 */
export async function POST(
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

    const doc = await restoreDoc(id, user.id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Failed to restore doc' },
        { status: 500 }
      );
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error restoring doc:', error);
    return NextResponse.json(
      { error: 'Failed to restore doc' },
      { status: 500 }
    );
  }
}


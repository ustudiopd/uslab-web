import { NextRequest, NextResponse } from 'next/server';
import { restoreDocFromVersion } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * POST /api/admin/exec-docs/[id]/versions/[versionId]/restore
 * 버전으로 문서 복원
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    // 인증 및 운영진 확인
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyAdminAuth(authHeader);

    if (authError || !user) {
      const status = authError?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status });
    }

    const { id, versionId } = await params;

    const doc = await restoreDocFromVersion(id, versionId, user.id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Failed to restore from version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error('Error restoring from version:', error);
    return NextResponse.json(
      { error: 'Failed to restore from version' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getDocVersions, createDocVersion } from '@/lib/queries/execDocs';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/exec-docs/[id]/versions
 * 문서 버전 목록 조회
 */
export async function GET(
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

    const versions = await getDocVersions(id);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/exec-docs/[id]/versions
 * 문서 버전 생성 (수동 스냅샷)
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

    const body = await request.json();
    const changeType = body.change_type || 'manual_snapshot';
    const note = body.note || null;

    if (
      changeType !== 'auto_snapshot' &&
      changeType !== 'manual_snapshot' &&
      changeType !== 'restore_point'
    ) {
      return NextResponse.json(
        { error: 'Invalid change_type' },
        { status: 400 }
      );
    }

    const version = await createDocVersion(id, changeType, note, user.id);

    if (!version) {
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}


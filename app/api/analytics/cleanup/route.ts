import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { getAnalyticsTableName, ANALYTICS_PREFIX } from '@/lib/config/analytics';

/**
 * POST /api/analytics/cleanup
 * 
 * Retention 정리 함수 실행
 * - 90일 지난 트래킹 데이터 삭제
 * - Vercel Cron에서 호출
 * 
 * 보안: Authorization 헤더에 CRON_SECRET 확인
 */
export async function POST(request: NextRequest) {
  try {
    // Vercel Cron 보안: Authorization 헤더 확인
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const prefix = ANALYTICS_PREFIX;

    // Retention 정리 함수 호출
    const { data, error } = await supabase.rpc(
      `${prefix}_cleanup_old_tracking`
    );

    if (error) {
      console.error('Error running cleanup:', error);
      return NextResponse.json(
        { error: 'Failed to run cleanup', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedRows: data || 0,
      prefix,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/cleanup
 * 
 * 수동 실행용 (개발/테스트)
 */
export async function GET(request: NextRequest) {
  // 개발 환경에서만 허용 (선택적)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const prefix = ANALYTICS_PREFIX;

    const { data, error } = await supabase.rpc(
      `${prefix}_cleanup_old_tracking`
    );

    if (error) {
      console.error('Error running cleanup:', error);
      return NextResponse.json(
        { error: 'Failed to run cleanup', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedRows: data || 0,
      prefix,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}






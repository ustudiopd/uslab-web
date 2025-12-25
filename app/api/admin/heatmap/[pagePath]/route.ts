import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/client';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/admin/heatmap/[pagePath]
 * 특정 페이지의 히트맵 데이터 조회 (클릭 좌표 집계)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pagePath: string }> }
) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pagePath } = await params;
    const decodedPagePath = decodeURIComponent(pagePath);

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const serverSupabase = createServerClient();
    const eventsTable = `${ANALYTICS_PREFIX}_events`;
    
    // 테이블이 없을 수 있으므로 확인
    const { error: tableError } = await (serverSupabase as any)
      .from(eventsTable)
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      // 테이블이 없으면 빈 데이터 반환
      return NextResponse.json({
        clicks: [],
        grid: {},
        stats: {
          totalClicks: 0,
          uniqueElements: 0,
          gridSize: 20,
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      });
    }

    // 해당 페이지의 클릭 이벤트 조회
    const { data: events, error } = await (serverSupabase as any)
      .from(eventsTable)
      .select('props')
      .eq('name', 'click')
      .eq('page_path', decodedPagePath)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching heatmap data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch heatmap data', details: error.message },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        clicks: [],
        grid: {},
        stats: {
          totalClicks: 0,
          uniqueElements: 0,
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      });
    }

    // 클릭 좌표 추출 및 그리드 집계
    const gridSize = 20; // 20x20 그리드로 분할
    const gridMap = new Map<string, number>();

    events.forEach((event: any) => {
      const props = event.props || {};
      const x = props.x; // 0~1 정규화된 좌표
      const y = props.y; // 0~1 정규화된 좌표

      if (typeof x !== 'number' || typeof y !== 'number') {
        return;
      }

      // 그리드 좌표 계산 (0~1을 0~gridSize로 변환)
      const gridX = Math.floor(x * gridSize);
      const gridY = Math.floor(y * gridSize);
      const gridKey = `${gridX},${gridY}`;

      gridMap.set(gridKey, (gridMap.get(gridKey) || 0) + 1);
    });

    // 그리드를 객체로 변환
    const grid: Record<string, number> = {};
    gridMap.forEach((count, key) => {
      grid[key] = count;
    });

    // 전체 클릭 수
    const totalClicks = events.length;

    // 고유한 element_id 개수
    const uniqueElements = new Set(
      events
        .map((e: any) => e.props?.element_id)
        .filter((id: any) => id !== null && id !== undefined)
    ).size;

    // 클릭 좌표 배열 (시각화용)
    const clicks = events.map((event: any) => ({
      x: event.props?.x || 0,
      y: event.props?.y || 0,
      elementId: event.props?.element_id || null,
      elementTag: event.props?.element_tag || null,
    }));

    return NextResponse.json({
      clicks,
      grid,
      stats: {
        totalClicks,
        uniqueElements,
        gridSize,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data', details: error.message },
      { status: 500 }
    );
  }
}


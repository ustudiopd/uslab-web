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
    
    // v2: gridSize 파라미터 (기본 200, 범위 50~400)
    const gridParam = parseInt(searchParams.get('grid') || '200', 10);
    const gridSize = Math.max(50, Math.min(400, gridParam));
    
    // v2: device 필터 (all | mobile | desktop)
    const deviceFilter = searchParams.get('device') || 'all';
    if (!['all', 'mobile', 'desktop'].includes(deviceFilter)) {
      return NextResponse.json(
        { error: 'Invalid device parameter. Must be "all", "mobile", or "desktop"' },
        { status: 400 }
      );
    }

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
          gridSize,
          coordMode: 'page', // v2: 좌표 모드
          filteredBy: { device: deviceFilter }, // v2: 필터 정보
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      });
    }

    // 해당 페이지의 클릭 이벤트 조회 (페이지네이션으로 모든 데이터 가져오기)
    let allEvents: any[] = [];
    let offset = 0;
    const limit = 1000; // Supabase 기본 제한
    let hasMore = true;

    while (hasMore) {
      const { data: events, error } = await (serverSupabase as any)
        .from(eventsTable)
        .select('props')
        .eq('name', 'click')
        .eq('page_path', decodedPagePath)
        .gte('created_at', startDate.toISOString())
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching heatmap data:', error);
        return NextResponse.json(
          { error: 'Failed to fetch heatmap data', details: error.message },
          { status: 500 }
        );
      }

      if (!events || events.length === 0) {
        hasMore = false;
      } else {
        allEvents = allEvents.concat(events);
        offset += limit;
        hasMore = events.length === limit;
      }
    }

    if (allEvents.length === 0) {
      return NextResponse.json({
        clicks: [],
        grid: {},
        stats: {
          totalClicks: 0,
          uniqueElements: 0,
          gridSize,
          coordMode: 'page',
          filteredBy: { device: deviceFilter },
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      });
    }

    // v2: 디바이스 필터 적용
    let filteredEvents = allEvents;
    if (deviceFilter !== 'all') {
      filteredEvents = allEvents.filter((event: any) => {
        const props = event.props || {};
        return props.device_bucket === deviceFilter;
      });
    }

    // v2: 클릭 좌표 추출 및 그리드 집계 (좌표 우선순위: page_x/page_y → x/y)
    const gridMap = new Map<string, number>();
    let coordMode: 'page' | 'viewport' = 'page';
    let hasPageCoords = false;

    filteredEvents.forEach((event: any) => {
      const props = event.props || {};
      
      // 좌표 우선순위: page_x/page_y (v2) → x/y (레거시)
      let x: number | null = null;
      let y: number | null = null;

      if (typeof props.page_x === 'number' && typeof props.page_y === 'number') {
        x = props.page_x;
        y = props.page_y;
        hasPageCoords = true;
      } else if (typeof props.x === 'number' && typeof props.y === 'number') {
        x = props.x;
        y = props.y;
      }

      if (x === null || y === null || !isFinite(x) || !isFinite(y)) {
        return;
      }

      // 좌표 범위 검증 (0~1)
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        return;
      }

      // 그리드 좌표 계산 (0~1을 0~gridSize로 변환)
      const gridX = Math.floor(x * gridSize);
      const gridY = Math.floor(y * gridSize);
      
      // 범위 체크
      if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
        return;
      }

      const gridKey = `${gridX},${gridY}`;
      gridMap.set(gridKey, (gridMap.get(gridKey) || 0) + 1);
    });

    // 좌표 모드 결정
    coordMode = hasPageCoords ? 'page' : 'viewport';

    // v2: 샘플링 전략 (이벤트 수가 너무 많을 때 상위 N개만 렌더링)
    const MAX_BINS = 20000; // 최대 bin 수
    let gridEntries = Array.from(gridMap.entries());
    let samplingWarning: string | null = null;

    if (gridEntries.length > MAX_BINS) {
      // 클릭 수 기준으로 정렬하여 상위 N개만 선택
      gridEntries = gridEntries
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_BINS);
      samplingWarning = `Too many data points (${gridMap.size}), showing top ${MAX_BINS} bins`;
    }

    // 그리드를 객체로 변환
    const grid: Record<string, number> = {};
    gridEntries.forEach(([key, count]) => {
      grid[key] = count;
    });

    // 전체 클릭 수
    const totalClicks = filteredEvents.length;
    const originalClicks = allEvents.length;

    // 고유한 element_id 개수
    const uniqueElements = new Set(
      filteredEvents
        .map((e: any) => e.props?.element_id)
        .filter((id: any) => id !== null && id !== undefined)
    ).size;

    // 클릭 좌표 배열 (시각화용) - 샘플링된 bin만
    const clicks = gridEntries.map(([key, count]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      // 그리드 중심 좌표로 변환 (0~1)
      const x = (gridX + 0.5) / gridSize;
      const y = (gridY + 0.5) / gridSize;
      return {
        x,
        y,
        count,
        gridX,
        gridY,
      };
    });

    return NextResponse.json({
      clicks,
      grid,
      stats: {
        totalClicks,
        originalClicks, // 필터 적용 전 클릭 수
        uniqueElements,
        gridSize,
        coordMode, // v2: 사용된 좌표 모드
        filteredBy: { device: deviceFilter }, // v2: 적용된 필터
        samplingWarning, // v2: 샘플링 경고
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


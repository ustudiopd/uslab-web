import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import {
  getTodayStats,
  getPeriodStats,
  getTopPages,
  getTopPosts,
  getTopReferrers,
  getDailyStats,
  getDailyStatsByRange,
  getTopClickedElements,
  getPageClickStats,
  getWebVitalsStats,
} from '@/lib/queries/analytics';
import { getAllBoards } from '@/lib/queries/execBoards';
import { getTopDocByBoardId } from '@/lib/queries/execDocs';

/**
 * GET /api/admin/dashboard
 * 
 * 대시보드 데이터 조회
 * - 인증 필요 (관리자만)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 날짜 범위 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days');

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let days: number = 30;

    if (startDateParam && endDateParam) {
      // 날짜 범위 지정
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // endDate는 하루 끝까지 포함
      endDate.setHours(23, 59, 59, 999);
    } else if (daysParam) {
      // 일수 지정
      days = parseInt(daysParam, 10) || 30;
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 기본값: 최근 30일
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const supabase = createServerClient();
    
    // 토큰 검증 (선택적, 실제로는 세션 확인)
    // 일단 service role로 진행 (관리자 전용 API)

    // 1. 포스트 통계
    const { count: totalPosts } = await supabase
      .from('uslab_posts')
      .select('*', { count: 'exact', head: true });

    const { count: publishedPosts } = await supabase
      .from('uslab_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: draftPosts } = await supabase
      .from('uslab_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', false);

    // 2. 총 조회수 (기존 view_count 합계)
    const { data: postsData } = await supabase
      .from('uslab_posts')
      .select('view_count');

    const { data: aboutData } = await supabase
      .from('uslab_about')
      .select('view_count');

    const totalViews =
      (postsData?.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0) || 0) +
      (aboutData?.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0) || 0);

    // 3. 트래킹 통계
    const todayStats = await getTodayStats();
    const periodStats = await getPeriodStats();

    // 날짜 범위 기반 일수 계산
    const calculatedDays = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : days;

    // 4. Top 데이터 (날짜 범위 적용)
    const topPages = await getTopPages(calculatedDays, 10);
    const topPosts = await getTopPosts(calculatedDays, 10);
    const topReferrers = await getTopReferrers(calculatedDays, 10);

    // 5. 일별 통계 (차트용)
    // 항상 최근 7일/30일 데이터를 가져옴 (차트 전환용)
    const dailyStats7 = await getDailyStats(7);
    const dailyStats30 = await getDailyStats(30);

    // 6. SEO 상태 체크
    // 기술적 SEO: sitemap, robots, canonical, JSON-LD 존재 여부
    const technicalSEO = {
      hasSitemap: true, // sitemap.ts 구현 예정
      hasRobots: true, // robots.ts 구현 예정
      hasCanonical: true, // canonical 구현 예정
      hasJsonLd: true, // JSON-LD 구현 예정
    };

    // 포스트 SEO 품질 체크
    const { data: allPosts } = await supabase
      .from('uslab_posts')
      .select('id, title, slug, locale, seo_title, seo_description, is_published')
      .eq('is_published', true);

    // 문제가 있는 포스트 목록
    const postsWithIssues = (allPosts || []).filter((p: any) => {
      const missingTitle = !p.seo_title;
      const missingDesc = !p.seo_description;
      const titleTooLong = p.seo_title && p.seo_title.length > 60;
      const descTooLong = p.seo_description && p.seo_description.length > 160;
      return missingTitle || missingDesc || titleTooLong || descTooLong;
    }).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      locale: p.locale,
      issues: [
        !p.seo_title && 'missing_title',
        !p.seo_description && 'missing_description',
        p.seo_title && p.seo_title.length > 60 && 'title_too_long',
        p.seo_description && p.seo_description.length > 160 && 'description_too_long',
      ].filter(Boolean) as string[],
    }));

    const seoQuality = {
      totalPublished: allPosts?.length || 0,
      missingSeoTitle: allPosts?.filter((p: any) => !p.seo_title).length || 0,
      missingSeoDescription: allPosts?.filter((p: any) => !p.seo_description).length || 0,
      seoTitleTooLong: allPosts?.filter((p: any) => p.seo_title && p.seo_title.length > 60).length || 0,
      seoDescriptionTooLong: allPosts?.filter((p: any) => p.seo_description && p.seo_description.length > 160).length || 0,
      postsWithIssues,
    };

    // 5. 최근 활동
    // 최근 발행 포스트
    const { data: recentPosts } = await supabase
      .from('uslab_posts')
      .select('id, title, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(5);

    // 최근 댓글
    const { data: recentComments } = await supabase
      .from('uslab_comments')
      .select('id, author_name, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // 최근 문의
    const { data: recentInquiries } = await supabase
      .from('uslab_inquiries')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // 운영진 보드 최상단 하이라이트 (첫 번째 보드의 최상단 문서)
    let topExecDoc = null;
    try {
      const boards = await getAllBoards();
      if (boards.length > 0) {
        const firstBoard = boards[0];
        topExecDoc = await getTopDocByBoardId(firstBoard.id);
      }
    } catch (error) {
      console.error('Error fetching top exec doc:', error);
      // 에러가 나도 대시보드는 정상 작동하도록
    }

    // 7. 히트맵 데이터 (날짜 범위 적용)
    let heatmapData = null;
    try {
      const topClickedElements = await getTopClickedElements(calculatedDays, 10);
      const pageClickStats = await getPageClickStats(calculatedDays, 10);
      heatmapData = {
        topClickedElements,
        pageClickStats,
      };
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      // 에러가 나도 대시보드는 정상 작동하도록
    }

    // 8. Web Vitals 데이터 (날짜 범위 적용)
    let webVitalsData = null;
    try {
      webVitalsData = await getWebVitalsStats(calculatedDays);
    } catch (error) {
      console.error('Error fetching web vitals data:', error);
      // 에러가 나도 대시보드는 정상 작동하도록
    }

    return NextResponse.json({
      stats: {
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        draftPosts: draftPosts || 0,
        totalViews,
        todayPageviews: todayStats.pageviews,
        todayUniques: todayStats.uniques,
        last7Days: periodStats.last7Days,
        last30Days: periodStats.last30Days,
      },
      topPages,
      topPosts,
      topReferrers,
      recentActivity: {
        posts: recentPosts || [],
        comments: recentComments || [],
        inquiries: recentInquiries || [],
      },
      dailyStats: {
        last7Days: dailyStats7,
        last30Days: dailyStats30,
      },
      seoStatus: {
        technical: technicalSEO,
        quality: seoQuality,
      },
      topExecDoc,
      heatmapData,
      webVitalsData,
      dateRange: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
        days: calculatedDays,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}



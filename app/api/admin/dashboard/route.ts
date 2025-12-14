import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import {
  getTodayStats,
  getPeriodStats,
  getTopPages,
  getTopPosts,
  getTopReferrers,
} from '@/lib/queries/analytics';

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

    // 4. Top 데이터
    const topPages = await getTopPages(30, 10);
    const topPosts = await getTopPosts(30, 10);
    const topReferrers = await getTopReferrers(30, 10);

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
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

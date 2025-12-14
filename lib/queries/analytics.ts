/**
 * Analytics 쿼리 함수
 * 대시보드 및 분석 페이지에서 사용하는 집계 쿼리
 */

import { createServerClient } from '@/lib/supabase/client';

/**
 * 서버 Supabase 클라이언트 생성
 */
function getServerSupabase() {
  try {
    return createServerClient();
  } catch {
    throw new Error('Server Supabase client requires SUPABASE_SERVICE_ROLE_KEY');
  }
}

/**
 * 오늘 방문자 수 및 페이지뷰 (Asia/Seoul 기준)
 */
export async function getTodayStats(): Promise<{
  pageviews: number;
  uniques: number;
}> {
  const supabase = getServerSupabase();

  // 오늘 00:00 (KST) 기준
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // 페이지뷰 수
  const { count: pageviews } = await (supabase as any)
    .from('uslab_page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  // 고유 세션 수
  const { data: uniqueSessions } = await (supabase as any)
    .from('uslab_page_views')
    .select('session_id')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  const uniques = new Set(uniqueSessions?.map((pv: any) => pv.session_id) || []).size;

  return {
    pageviews: pageviews || 0,
    uniques,
  };
}

/**
 * 최근 N일 일별 페이지뷰 및 방문자 추이
 */
export async function getDailyStats(
  days: number = 30
): Promise<
  Array<{
    day: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 일별 집계 쿼리 (직접 쿼리)
  const { data: pageViews } = await (supabase as any)
    .from('uslab_page_views')
    .select('created_at, session_id')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // 일별로 그룹화
  const dailyMap = new Map<string, { pageviews: number; sessions: Set<string> }>();

  pageViews?.forEach((pv: any) => {
    const date = new Date(pv.created_at);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, { pageviews: 0, sessions: new Set() });
    }

    const day = dailyMap.get(dayKey)!;
    day.pageviews++;
    day.sessions.add(pv.session_id);
  });

  return Array.from(dailyMap.entries())
    .map(([day, stats]) => ({
      day,
      pageviews: stats.pageviews,
      uniques: stats.sessions.size,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Top Pages (최근 N일)
 */
export async function getTopPages(
  days: number = 30,
  limit: number = 20
): Promise<
  Array<{
    page_path: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from('uslab_page_views')
    .select('page_path, session_id')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return [];
  }

  // 페이지별 집계
  const pageMap = new Map<
    string,
    { pageviews: number; sessions: Set<string> }
  >();

  data.forEach((pv: any) => {
    if (!pageMap.has(pv.page_path)) {
      pageMap.set(pv.page_path, { pageviews: 0, sessions: new Set() });
    }

    const page = pageMap.get(pv.page_path)!;
    page.pageviews++;
    page.sessions.add(pv.session_id);
  });

  return Array.from(pageMap.entries())
    .map(([page_path, stats]) => ({
      page_path,
      pageviews: stats.pageviews,
      uniques: stats.sessions.size,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);
}

/**
 * Top Posts (최근 N일)
 */
export async function getTopPosts(
  days: number = 30,
  limit: number = 20
): Promise<
  Array<{
    post_id: string;
    title: string;
    locale: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from('uslab_page_views')
    .select('post_id, session_id, uslab_posts!inner(title, locale)')
    .gte('created_at', startDate.toISOString())
    .not('post_id', 'is', null);

  if (error || !data) {
    return [];
  }

  // 포스트별 집계
  const postMap = new Map<
    string,
    {
      title: string;
      locale: string;
      pageviews: number;
      sessions: Set<string>;
    }
  >();

  data.forEach((pv: any) => {
    const postId = pv.post_id;
    const post = pv.uslab_posts;

    if (!postMap.has(postId)) {
      postMap.set(postId, {
        title: post.title,
        locale: post.locale,
        pageviews: 0,
        sessions: new Set(),
      });
    }

    const postStats = postMap.get(postId)!;
    postStats.pageviews++;
    postStats.sessions.add(pv.session_id);
  });

  return Array.from(postMap.entries())
    .map(([post_id, stats]) => ({
      post_id,
      title: stats.title,
      locale: stats.locale,
      pageviews: stats.pageviews,
      uniques: stats.sessions.size,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);
}

/**
 * Top Referrers (최근 N일)
 */
export async function getTopReferrers(
  days: number = 30,
  limit: number = 20
): Promise<
  Array<{
    referrer_host: string | null;
    sessions: number;
  }>
> {
  const supabase = getServerSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from('uslab_sessions')
    .select('referrer_host')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return [];
  }

  // Referrer별 집계
  const referrerMap = new Map<string | null, number>();

  data.forEach((session: any) => {
    const host = session.referrer_host || '(direct)';
    referrerMap.set(host, (referrerMap.get(host) || 0) + 1);
  });

  return Array.from(referrerMap.entries())
    .map(([referrer_host, sessions]) => ({
      referrer_host: referrer_host === '(direct)' ? null : referrer_host,
      sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

/**
 * 최근 7일 및 30일 통계
 */
export async function getPeriodStats(): Promise<{
  last7Days: { pageviews: number; uniques: number };
  last30Days: { pageviews: number; uniques: number };
}> {
  const supabase = getServerSupabase();

  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  // 7일 통계
  const { count: pageviews7d } = await (supabase as any)
    .from('uslab_page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7Days.toISOString());

  const { data: sessions7d } = await (supabase as any)
    .from('uslab_page_views')
    .select('session_id')
    .gte('created_at', last7Days.toISOString());

  const uniques7d = new Set(sessions7d?.map((pv: any) => pv.session_id) || []).size;

  // 30일 통계
  const { count: pageviews30d } = await (supabase as any)
    .from('uslab_page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last30Days.toISOString());

  const { data: sessions30d } = await (supabase as any)
    .from('uslab_page_views')
    .select('session_id')
    .gte('created_at', last30Days.toISOString());

  const uniques30d = new Set(sessions30d?.map((pv: any) => pv.session_id) || []).size;

  return {
    last7Days: {
      pageviews: pageviews7d || 0,
      uniques: uniques7d,
    },
    last30Days: {
      pageviews: pageviews30d || 0,
      uniques: uniques30d,
    },
  };
}


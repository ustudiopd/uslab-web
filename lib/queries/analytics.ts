/**
 * Analytics 쿼리 함수
 * 대시보드 및 분석 페이지에서 사용하는 집계 쿼리
 * v2: prefix를 인자로 받아 이식 가능하게 함
 */

import { createServerClient } from '@/lib/supabase/client';
import { getAnalyticsTableName, ANALYTICS_PREFIX } from '@/lib/config/analytics';

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
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 * @param tz 타임존 (기본값: 'Asia/Seoul')
 */
export async function getTodayStats(
  prefix: string = ANALYTICS_PREFIX,
  tz: string = 'Asia/Seoul'
): Promise<{
  pageviews: number;
  uniques: number;
}> {
  const supabase = getServerSupabase();
  const pageViewsTable = `${prefix}_page_views`;

  // 오늘 00:00 (KST) 기준
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // 페이지뷰 수
  const { count: pageviews } = await (supabase as any)
    .from(pageViewsTable)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  // 고유 세션 수
  const { data: uniqueSessions } = await (supabase as any)
    .from(pageViewsTable)
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
 * 한국 시간 기준으로 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getKSTDateString(date: Date): string {
  // 한국 시간(UTC+9)으로 변환
  const kstOffset = 9 * 60; // 분 단위
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst.toISOString().split('T')[0];
}

/**
 * 한국 시간 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 객체로 변환
 * 예: "2025-12-24" -> 해당 날짜의 한국 시간 00:00:00을 UTC로 변환
 */
function kstDateStringToUTC(kstDateStr: string, hour: number = 0, minute: number = 0, second: number = 0, ms: number = 0): Date {
  // 한국 시간 기준 날짜 문자열을 파싱
  const [year, month, day] = kstDateStr.split('-').map(Number);
  
  // 한국 시간을 UTC로 변환 (UTC = KST - 9시간)
  // 예: KST 2025-12-24 00:00:00 = UTC 2025-12-23 15:00:00
  // 예: KST 2025-12-24 23:59:59 = UTC 2025-12-24 14:59:59
  
  // 한국 시간 기준으로 Date 객체 생성 (UTC 시간으로 해석)
  // 예: KST 2025-12-24 00:00:00을 UTC로 변환하려면
  // UTC 2025-12-24 00:00:00에서 9시간을 빼면 UTC 2025-12-23 15:00:00
  const utcHour = hour - 9;
  let utcDay = day;
  let utcMonth = month - 1;
  let utcYear = year;
  
  // 시간이 음수가 되면 전날로 이동
  if (utcHour < 0) {
    const adjustedHour = utcHour + 24;
    utcDay -= 1;
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 0) {
        utcMonth = 11;
        utcYear -= 1;
      }
      // 해당 월의 마지막 날 계산
      utcDay = new Date(Date.UTC(utcYear, utcMonth + 1, 0)).getUTCDate();
    }
    return new Date(Date.UTC(utcYear, utcMonth, utcDay, adjustedHour, minute, second, ms));
  }
  
  return new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHour, minute, second, ms));
}

/**
 * 한국 시간 기준으로 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
 */
function getTodayKSTString(): string {
  const now = new Date();
  // UTC 시간에 9시간을 더해서 한국 시간으로 변환
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
  const kst = new Date(kstTime);
  return kst.toISOString().split('T')[0];
}

/**
 * 최근 N일 일별 페이지뷰 및 방문자 추이 (한국 시간 기준)
 * @param days 기간 (일수, 기본값: 30)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getDailyStats(
  days: number = 30,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    day: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();
  const pageViewsTable = `${prefix}_page_views`;

  // 한국 시간 기준으로 오늘 날짜 계산
  const todayKSTStr = getTodayKSTString(); // "2025-12-25" (현재 오전 8시 23분 기준)
  const endDateKSTStr = todayKSTStr;
  
  // 시작 날짜 계산 (days일 전)
  // YYYY-MM-DD 형식의 문자열을 파싱하여 날짜 계산
  const [year, month, day] = todayKSTStr.split('-').map(Number);
  const startDateKST = new Date(year, month - 1, day);
  startDateKST.setDate(startDateKST.getDate() - days);
  const startDateKSTStr = `${startDateKST.getFullYear()}-${String(startDateKST.getMonth() + 1).padStart(2, '0')}-${String(startDateKST.getDate()).padStart(2, '0')}`;

  // 한국 시간 기준 날짜를 UTC로 변환하여 쿼리 사용
  const startDateUTC = kstDateStringToUTC(startDateKSTStr, 0, 0, 0, 0);
  const endDateUTC = kstDateStringToUTC(endDateKSTStr, 23, 59, 59, 999);
  
  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getDailyStats]', {
      days,
      startDateKSTStr,
      endDateKSTStr,
      startDateUTC: startDateUTC.toISOString(),
      endDateUTC: endDateUTC.toISOString(),
    });
  }

  // 일별 집계 쿼리 (직접 쿼리)
  // Supabase 기본 limit(1000)을 제거하기 위해 페이지네이션으로 모든 데이터 가져오기
  let pageViews: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await (supabase as any)
      .from(pageViewsTable)
      .select('created_at, session_id')
      .gte('created_at', startDateUTC.toISOString())
      .lte('created_at', endDateUTC.toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching page views:', error);
      break;
    }

    if (batch && batch.length > 0) {
      pageViews = pageViews.concat(batch);
      from += pageSize;
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  // 일별로 그룹화 (한국 시간 기준)
  const dailyMap = new Map<string, { pageviews: number; sessions: Set<string> }>();

  (pageViews || []).forEach((pv: any) => {
    // UTC 시간을 한국 시간으로 변환
    const date = new Date(pv.created_at);
    // UTC 시간에 9시간을 더해서 한국 시간으로 변환
    const kstTime = date.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTime);
    const dayKey = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, { pageviews: 0, sessions: new Set() });
    }

    const day = dailyMap.get(dayKey)!;
    day.pageviews++;
    day.sessions.add(pv.session_id);
  });

  // 빈 날짜 채우기 (모든 날짜가 포함되도록)
  const result: Array<{ day: string; pageviews: number; uniques: number }> = [];
  
  // 한국 시간 기준 날짜 범위 사용 (YYYY-MM-DD 형식으로 파싱)
  const [startYear, startMonth, startDay] = startDateKSTStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKSTStr.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const stats = dailyMap.get(dayKey);
    result.push({
      day: dayKey,
      pageviews: stats?.pageviews || 0,
      uniques: stats?.sessions.size || 0,
    });
  }
  
  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getDailyStats]', {
      days,
      startDateKSTStr,
      endDateKSTStr,
      startDateUTC: startDateUTC.toISOString(),
      endDateUTC: endDateUTC.toISOString(),
      pageViewsCount: pageViews?.length || 0,
      dailyMapSize: dailyMap.size,
      dailyMapKeys: Array.from(dailyMap.keys()),
      dailyMapEntries: Array.from(dailyMap.entries()).map(([day, stats]) => ({
        day,
        pageviews: stats.pageviews,
        uniques: stats.sessions.size,
      })),
      resultLength: result.length,
      resultLast7: result.slice(-7),
    });
  }

  return result;
}

/**
 * 날짜 범위 기반 일별 페이지뷰 및 방문자 추이 (한국 시간 기준)
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getDailyStatsByRange(
  startDate: Date,
  endDate: Date,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    day: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();
  const pageViewsTable = `${prefix}_page_views`;

  // 입력된 날짜를 한국 시간 기준으로 변환
  const startDateKSTStr = getKSTDateString(startDate);
  const endDateKSTStr = getKSTDateString(endDate);

  // 한국 시간 기준 날짜를 UTC로 변환하여 쿼리 사용
  const startDateUTC = kstDateStringToUTC(startDateKSTStr, 0, 0, 0, 0);
  const endDateUTC = kstDateStringToUTC(endDateKSTStr, 23, 59, 59, 999);

  // 일별 집계 쿼리 (날짜 범위 지정)
  // Supabase 기본 limit(1000)을 제거하기 위해 페이지네이션으로 모든 데이터 가져오기
  let pageViews: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await (supabase as any)
      .from(pageViewsTable)
      .select('created_at, session_id')
      .gte('created_at', startDateUTC.toISOString())
      .lte('created_at', endDateUTC.toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching daily stats by range:', error);
      break;
    }

    if (batch && batch.length > 0) {
      pageViews = pageViews.concat(batch);
      from += pageSize;
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  // 일별로 그룹화 (한국 시간 기준)
  const dailyMap = new Map<string, { pageviews: number; sessions: Set<string> }>();

  (pageViews || []).forEach((pv: any) => {
    // UTC 시간을 한국 시간으로 변환
    const date = new Date(pv.created_at);
    // UTC 시간에 9시간을 더해서 한국 시간으로 변환
    const kstTime = date.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTime);
    const dayKey = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, { pageviews: 0, sessions: new Set() });
    }

    const day = dailyMap.get(dayKey)!;
    day.pageviews++;
    day.sessions.add(pv.session_id);
  });

  // 빈 날짜 채우기 (모든 날짜가 포함되도록)
  const result: Array<{ day: string; pageviews: number; uniques: number }> = [];
  
  // 한국 시간 기준 날짜 범위 사용 (YYYY-MM-DD 형식으로 파싱)
  const [startYear, startMonth, startDay] = startDateKSTStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKSTStr.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const stats = dailyMap.get(dayKey);
    result.push({
      day: dayKey,
      pageviews: stats?.pageviews || 0,
      uniques: stats?.sessions.size || 0,
    });
  }
  
  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getDailyStatsByRange] result:', result);
  }

  return result;
}

/**
 * Top Pages (최근 N일)
 * @param days 기간 (일수, 기본값: 30)
 * @param limit 최대 결과 수 (기본값: 20)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getTopPages(
  days: number = 30,
  limit: number = 20,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    page_path: string;
    pageviews: number;
    uniques: number;
  }>
> {
  const supabase = getServerSupabase();
  const pageViewsTable = `${prefix}_page_views`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from(pageViewsTable)
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
 * @param days 기간 (일수, 기본값: 30)
 * @param limit 최대 결과 수 (기본값: 20)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getTopPosts(
  days: number = 30,
  limit: number = 20,
  prefix: string = ANALYTICS_PREFIX
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
  const pageViewsTable = `${prefix}_page_views`;
  const postsTable = `${prefix}_posts`;

  // 한국 시간 기준으로 날짜 계산
  const todayKSTStr = getTodayKSTString();
  const [year, month, day] = todayKSTStr.split('-').map(Number);
  const startDateKST = new Date(year, month - 1, day);
  startDateKST.setDate(startDateKST.getDate() - days);
  const startDateKSTStr = `${startDateKST.getFullYear()}-${String(startDateKST.getMonth() + 1).padStart(2, '0')}-${String(startDateKST.getDate()).padStart(2, '0')}`;

  // 한국 시간 기준 날짜를 UTC로 변환
  const startDateUTC = kstDateStringToUTC(startDateKSTStr, 0, 0, 0, 0);

  // 페이지네이션으로 모든 데이터 가져오기
  // post_id가 없어도 page_path에서 포스트를 찾을 수 있도록 page_path도 가져오기
  let allData: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await (supabase as any)
      .from(pageViewsTable)
      .select('post_id, session_id, page_path, locale')
      .gte('created_at', startDateUTC.toISOString())
      .or('post_id.not.is.null,page_path.like.*/blog/*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching top posts:', error);
      break;
    }

    if (batch && batch.length > 0) {
      allData = allData.concat(batch);
      from += pageSize;
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const data = allData;

  if (!data || data.length === 0) {
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

  // 포스트 정보를 한 번에 가져오기 (slug -> post_id 매핑)
  const slugToPostMap = new Map<string, { id: string; title: string; locale: string }>();
  const slugsToFetch = new Set<string>();

  // page_path에서 slug 추출 (쿼리 파라미터 제거)
  data.forEach((pv: any) => {
    if (!pv.post_id && pv.page_path) {
      // 쿼리 파라미터와 해시 제거
      const cleanPath = pv.page_path.split('?')[0].split('#')[0];
      const blogMatch = cleanPath.match(/^\/(?:ko|en)\/blog\/([^/]+)/);
      if (blogMatch) {
        const slug = blogMatch[1];
        const pathLocale = pv.locale || (cleanPath.startsWith('/ko/') ? 'ko' : 'en');
        slugsToFetch.add(`${slug}:${pathLocale}`);
      }
    }
  });

  // 포스트 정보 일괄 조회
  if (slugsToFetch.size > 0) {
    const slugLocalePairs = Array.from(slugsToFetch).map(pair => {
      const [slug, locale] = pair.split(':');
      return { slug, locale };
    });

    for (const { slug, locale } of slugLocalePairs) {
      const { data: post } = await (supabase as any)
        .from(postsTable)
        .select('id, title, locale, slug')
        .eq('slug', slug)
        .eq('locale', locale)
        .eq('is_published', true)
        .single();

      if (post) {
        slugToPostMap.set(`${slug}:${locale}`, {
          id: post.id,
          title: post.title,
          locale: post.locale,
        });
      }
    }
  }

  // post_id가 있는 경우 포스트 정보 가져오기
  const postIdsToFetch = new Set<string>();
  data.forEach((pv: any) => {
    if (pv.post_id && !postMap.has(pv.post_id)) {
      postIdsToFetch.add(pv.post_id);
    }
  });

  if (postIdsToFetch.size > 0) {
    const { data: posts } = await (supabase as any)
      .from(postsTable)
      .select('id, title, locale')
      .in('id', Array.from(postIdsToFetch))
      .eq('is_published', true);

    if (posts) {
      posts.forEach((post: any) => {
        slugToPostMap.set(post.id, {
          id: post.id,
          title: post.title,
          locale: post.locale,
        });
      });
    }
  }

  // 페이지뷰 데이터 처리
  data.forEach((pv: any) => {
    let postId: string | null = pv.post_id;
    let postInfo: { id: string; title: string; locale: string } | null = null;

    // post_id가 있으면 직접 사용
    if (postId) {
      postInfo = slugToPostMap.get(postId) || null;
    } else if (pv.page_path) {
      // post_id가 없으면 page_path에서 slug 추출하여 매핑
      // 쿼리 파라미터 제거 후 매칭
      const cleanPath = pv.page_path.split('?')[0].split('#')[0];
      const blogMatch = cleanPath.match(/^\/(?:ko|en)\/blog\/([^/]+)/);
      if (blogMatch) {
        const slug = blogMatch[1];
        const pathLocale = pv.locale || (cleanPath.startsWith('/ko/') ? 'ko' : 'en');
        postInfo = slugToPostMap.get(`${slug}:${pathLocale}`) || null;
        if (postInfo) {
          postId = postInfo.id;
        }
      }
    }

    // 포스트 정보가 있으면 집계
    if (postId && postInfo) {
      if (!postMap.has(postId)) {
        postMap.set(postId, {
          title: postInfo.title,
          locale: postInfo.locale,
          pageviews: 0,
          sessions: new Set(),
        });
      }

      const postStats = postMap.get(postId)!;
      postStats.pageviews++;
      postStats.sessions.add(pv.session_id);
    }
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
 * @param days 기간 (일수, 기본값: 30)
 * @param limit 최대 결과 수 (기본값: 20)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getTopReferrers(
  days: number = 30,
  limit: number = 20,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    referrer_host: string | null;
    sessions: number;
  }>
> {
  const supabase = getServerSupabase();
  const sessionsTable = `${prefix}_sessions`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from(sessionsTable)
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
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getPeriodStats(
  prefix: string = ANALYTICS_PREFIX
): Promise<{
  last7Days: { pageviews: number; uniques: number };
  last30Days: { pageviews: number; uniques: number };
}> {
  const supabase = getServerSupabase();
  const pageViewsTable = `${prefix}_page_views`;

  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  // 7일 통계
  const { count: pageviews7d } = await (supabase as any)
    .from(pageViewsTable)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7Days.toISOString());

  const { data: sessions7d } = await (supabase as any)
    .from(pageViewsTable)
    .select('session_id')
    .gte('created_at', last7Days.toISOString());

  const uniques7d = new Set(sessions7d?.map((pv: any) => pv.session_id) || []).size;

  // 30일 통계
  const { count: pageviews30d } = await (supabase as any)
    .from(pageViewsTable)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last30Days.toISOString());

  const { data: sessions30d } = await (supabase as any)
    .from(pageViewsTable)
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

/**
 * Top Clicked Elements (최근 N일)
 * @param days 기간 (일수, 기본값: 30)
 * @param limit 최대 결과 수 (기본값: 20)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getTopClickedElements(
  days: number = 30,
  limit: number = 20,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    element_id: string | null;
    page_path: string;
    clicks: number;
  }>
> {
  const supabase = getServerSupabase();
  const eventsTable = `${prefix}_events`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from(eventsTable)
    .select('page_path, props')
    .eq('name', 'click')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return [];
  }

  // element_id별 집계
  const clickMap = new Map<string, number>();

  data.forEach((event: any) => {
    const elementId = event.props?.element_id || '(no-id)';
    const key = `${event.page_path}::${elementId}`;
    clickMap.set(key, (clickMap.get(key) || 0) + 1);
  });

  return Array.from(clickMap.entries())
    .map(([key, clicks]) => {
      const [page_path, element_id] = key.split('::');
      return {
        element_id: element_id === '(no-id)' ? null : element_id,
        page_path,
        clicks,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

/**
 * 페이지별 클릭 통계 (최근 N일)
 * @param days 기간 (일수, 기본값: 30)
 * @param limit 최대 결과 수 (기본값: 10)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getPageClickStats(
  days: number = 30,
  limit: number = 10,
  prefix: string = ANALYTICS_PREFIX
): Promise<
  Array<{
    page_path: string;
    clicks: number;
    unique_elements: number;
  }>
> {
  const supabase = getServerSupabase();
  const eventsTable = `${prefix}_events`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from(eventsTable)
    .select('page_path, props')
    .eq('name', 'click')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return [];
  }

  // 페이지별 집계
  const pageMap = new Map<
    string,
    { clicks: number; elements: Set<string> }
  >();

  data.forEach((event: any) => {
    const pagePath = event.page_path;
    const elementId = event.props?.element_id || '(no-id)';

    if (!pageMap.has(pagePath)) {
      pageMap.set(pagePath, { clicks: 0, elements: new Set() });
    }

    const page = pageMap.get(pagePath)!;
    page.clicks++;
    page.elements.add(elementId);
  });

  return Array.from(pageMap.entries())
    .map(([page_path, stats]) => ({
      page_path,
      clicks: stats.clicks,
      unique_elements: stats.elements.size,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

/**
 * Web Vitals 통계 (최근 N일)
 * @param days 기간 (일수, 기본값: 30)
 * @param prefix Analytics prefix (기본값: ANALYTICS_PREFIX)
 */
export async function getWebVitalsStats(
  days: number = 30,
  prefix: string = ANALYTICS_PREFIX
): Promise<{
  metrics: Array<{
    name: string;
    p50: number;
    p75: number;
    p95: number;
    count: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }>;
}> {
  const supabase = getServerSupabase();
  const eventsTable = `${prefix}_events`;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from(eventsTable)
    .select('props')
    .eq('name', 'web_vital')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return { metrics: [] };
  }

  // 메트릭별로 그룹화
  const metricMap = new Map<
    string,
    {
      values: number[];
      ratings: { good: number; needsImprovement: number; poor: number };
    }
  >();

  data.forEach((event: any) => {
    const props = event.props || {};
    const metricName = props.name; // LCP, CLS, INP 등
    const value = props.value;
    const rating = props.rating;

    if (!metricName || typeof value !== 'number') {
      return;
    }

    if (!metricMap.has(metricName)) {
      metricMap.set(metricName, {
        values: [],
        ratings: { good: 0, needsImprovement: 0, poor: 0 },
      });
    }

    const metric = metricMap.get(metricName)!;
    metric.values.push(value);

    if (rating === 'good') {
      metric.ratings.good++;
    } else if (rating === 'needs-improvement') {
      metric.ratings.needsImprovement++;
    } else if (rating === 'poor') {
      metric.ratings.poor++;
    }
  });

  // 백분위수 계산 및 결과 생성
  const metrics = Array.from(metricMap.entries()).map(([name, data]) => {
    const sortedValues = data.values.sort((a, b) => a - b);
    const count = sortedValues.length;

    const getPercentile = (arr: number[], percentile: number): number => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((percentile / 100) * arr.length) - 1;
      return arr[Math.max(0, Math.min(index, arr.length - 1))];
    };

    return {
      name,
      p50: getPercentile(sortedValues, 50),
      p75: getPercentile(sortedValues, 75),
      p95: getPercentile(sortedValues, 95),
      count,
      good: data.ratings.good,
      needsImprovement: data.ratings.needsImprovement,
      poor: data.ratings.poor,
    };
  });

  return { metrics };
}



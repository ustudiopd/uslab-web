/**
 * AI 보고서 데이터 포맷팅 유틸리티
 * 대시보드 데이터를 AI 입력 형식으로 변환 (PII 제거, 데이터 제한, 사전 계산)
 */

import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase/client';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';
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
 * 백분위수 계산
 */
function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

/**
 * 참여도 집계 계산
 */
export async function calculateEngagementSummary(
  prefix: string,
  startDate: Date,
  endDate: Date
): Promise<{
  avgScrollDepthPct: number;
  p50ScrollDepthPct: number;
  avgViewDurationSec: number;
  p50ViewDurationSec: number;
  topEngagedPages: Array<{
    page_path: string;
    avgScrollDepthPct: number;
    avgViewDurationSec: number;
    pageviews: number;
  }>;
} | null> {
  const supabase = getServerSupabase();
  const eventsTable = `${prefix}_events`;

  // page_engagement 이벤트 조회
  const { data: engagementEvents } = await (supabase as any)
    .from(eventsTable)
    .select('page_path, props')
    .eq('name', 'page_engagement')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!engagementEvents || engagementEvents.length === 0) {
    return null;
  }

  // 스크롤 깊이 및 체류 시간 추출
  const scrollDepths: number[] = [];
  const viewDurations: number[] = [];
  const pageMap = new Map<string, { scrollDepths: number[]; durations: number[]; pageviews: number }>();

  engagementEvents.forEach((event: any) => {
    const props = event.props || {};
    const scrollDepth = props.scroll_depth_pct; // 0~1
    const viewDuration = props.view_duration_sec;

    if (typeof scrollDepth === 'number') {
      scrollDepths.push(scrollDepth * 100); // 퍼센트로 변환
    }
    if (typeof viewDuration === 'number') {
      viewDurations.push(viewDuration);
    }

    // 페이지별 집계
    const pagePath = event.page_path;
    if (pagePath) {
      if (!pageMap.has(pagePath)) {
        pageMap.set(pagePath, { scrollDepths: [], durations: [], pageviews: 0 });
      }
      const page = pageMap.get(pagePath)!;
      if (scrollDepth) page.scrollDepths.push(scrollDepth * 100);
      if (viewDuration) page.durations.push(viewDuration);
      page.pageviews++;
    }
  });

  // 통계 계산
  const avgScrollDepth = scrollDepths.length > 0
    ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
    : 0;
  const p50ScrollDepth = scrollDepths.length > 0
    ? getPercentile(scrollDepths.sort((a, b) => a - b), 50)
    : 0;

  const avgViewDuration = viewDurations.length > 0
    ? viewDurations.reduce((a, b) => a + b, 0) / viewDurations.length
    : 0;
  const p50ViewDuration = viewDurations.length > 0
    ? getPercentile(viewDurations.sort((a, b) => a - b), 50)
    : 0;

  // Top 5 참여도 높은 페이지
  const topEngagedPages = Array.from(pageMap.entries())
    .map(([page_path, data]) => ({
      page_path,
      avgScrollDepthPct: data.scrollDepths.length > 0
        ? data.scrollDepths.reduce((a, b) => a + b, 0) / data.scrollDepths.length
        : 0,
      avgViewDurationSec: data.durations.length > 0
        ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
        : 0,
      pageviews: data.pageviews,
    }))
    .sort((a, b) => (a.avgScrollDepthPct + a.avgViewDurationSec) - (b.avgScrollDepthPct + b.avgViewDurationSec))
    .reverse()
    .slice(0, 5)
    .map((p) => ({
      ...p,
      avgScrollDepthPct: Math.round(p.avgScrollDepthPct * 100) / 100,
      avgViewDurationSec: Math.round(p.avgViewDurationSec * 100) / 100,
    }));

  return {
    avgScrollDepthPct: Math.round(avgScrollDepth * 100) / 100,
    p50ScrollDepthPct: Math.round(p50ScrollDepth * 100) / 100,
    avgViewDurationSec: Math.round(avgViewDuration * 100) / 100,
    p50ViewDurationSec: Math.round(p50ViewDuration * 100) / 100,
    topEngagedPages,
  };
}

/**
 * 사전 계산 신호값
 */
export async function calculateComputedSignals(
  prefix: string,
  startDate: Date,
  endDate: Date,
  previousStartDate?: Date,
  previousEndDate?: Date
): Promise<{
  trafficChangeRate: number;
  weekdayWeekendDiff: {
    weekdayAvg: number;
    weekendAvg: number;
    diffPct: number;
  };
  outliers: Array<{
    day: string;
    type: 'spike' | 'drop';
    value: number;
    deviation: number;
  }>;
  referrerChanges: Array<{
    referrer_host: string | null;
    changePct: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  webVitalsPoorRate: number;
  heatmapMismatch: Array<{
    element_id: string;
    page_path: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;
}> {
  // 1. 트래픽 변화율
  let trafficChangeRate = 0;
  if (previousStartDate && previousEndDate) {
    const currentStats = await getPeriodStats(prefix);
    const previousStats = await getPeriodStats(prefix);
    // 실제로는 날짜 범위를 받아야 하지만, 일단 0으로 설정
    // TODO: getPeriodStats에 날짜 범위 파라미터 추가 필요
  }

  // 2. 요일 패턴
  const dailyStats = await getDailyStatsByRange(startDate, endDate, prefix);
  const weekdayStats: number[] = [];
  const weekendStats: number[] = [];

  dailyStats.forEach((stat) => {
    const date = new Date(stat.day);
    const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendStats.push(stat.pageviews);
    } else {
      weekdayStats.push(stat.pageviews);
    }
  });

  const weekdayAvg = weekdayStats.length > 0
    ? weekdayStats.reduce((a, b) => a + b, 0) / weekdayStats.length
    : 0;
  const weekendAvg = weekendStats.length > 0
    ? weekendStats.reduce((a, b) => a + b, 0) / weekendStats.length
    : 0;
  const diffPct = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  // 3. 이상치 감지
  const pageviewValues = dailyStats.map((s) => s.pageviews);
  const avg = pageviewValues.length > 0
    ? pageviewValues.reduce((a, b) => a + b, 0) / pageviewValues.length
    : 0;
  const variance = pageviewValues.length > 0
    ? pageviewValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / pageviewValues.length
    : 0;
  const stdDev = Math.sqrt(variance);

  const outliers = dailyStats
    .map((stat) => {
      const deviation = stdDev > 0 ? Math.abs(stat.pageviews - avg) / stdDev : 0;
      return {
        day: stat.day,
        type: (stat.pageviews > avg + 2 * stdDev ? 'spike' : 'drop') as 'spike' | 'drop',
        value: stat.pageviews,
        deviation,
      };
    })
    .filter((o) => o.deviation > 2) // 2 표준편차 이상
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 5);

  // 4. 유입 경로 변화 (간단화: 현재만)
  const currentReferrers = await getTopReferrers(
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    10,
    prefix
  );
  const referrerChanges = currentReferrers.slice(0, 5).map((current) => ({
    referrer_host: current.referrer_host,
    changePct: 0, // 이전 기간 데이터가 없으면 0
    trend: 'stable' as const,
  }));

  // 5. Web Vitals Poor 비율
  const webVitals = await getWebVitalsStats(
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    prefix
  );
  let totalPoor = 0;
  let totalCount = 0;
  webVitals.metrics.forEach((metric) => {
    totalPoor += metric.poor;
    totalCount += metric.count;
  });
  const webVitalsPoorRate = totalCount > 0 ? (totalPoor / totalCount) * 100 : 0;

  // 6. 히트맵 불일치 (간단화: 클릭만, 전환은 나중에)
  const topClicks = await getTopClickedElements(
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    10,
    prefix
  );
  const heatmapMismatch: Array<{
    element_id: string;
    page_path: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }> = []; // TODO: 전환 데이터와 매칭 필요

  return {
    trafficChangeRate: Math.round(trafficChangeRate * 100) / 100,
    weekdayWeekendDiff: {
      weekdayAvg: Math.round(weekdayAvg * 100) / 100,
      weekendAvg: Math.round(weekendAvg * 100) / 100,
      diffPct: Math.round(diffPct * 100) / 100,
    },
    outliers,
    referrerChanges,
    webVitalsPoorRate: Math.round(webVitalsPoorRate * 100) / 100,
    heatmapMismatch,
  };
}

/**
 * 대시보드 데이터를 AI 입력 형식으로 변환 (PII 제거, 데이터 제한)
 */
export async function formatDashboardDataForAI(
  dashboardData: any,
  prefix: string = ANALYTICS_PREFIX,
  startDate: Date,
  endDate: Date,
  previousStartDate?: Date,
  previousEndDate?: Date
): Promise<{
  input: any;
  hash: string;
}> {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // 1. 일별 통계 (최근 7일 상세 + 30일 요약)
  const dailyStats7 = await getDailyStatsByRange(startDate, endDate, prefix);
  const last7Days = dailyStats7.slice(-7);
  const allDays = dailyStats7;
  const pageviewValues = allDays.map((d) => d.pageviews);
  const avgPageviews = pageviewValues.length > 0
    ? pageviewValues.reduce((a, b) => a + b, 0) / pageviewValues.length
    : 0;
  const maxPageviews = pageviewValues.length > 0 ? Math.max(...pageviewValues) : 0;
  const minPageviews = pageviewValues.length > 0 ? Math.min(...pageviewValues) : 0;
  const avgUniques = allDays.length > 0
    ? allDays.reduce((sum, d) => sum + d.uniques, 0) / allDays.length
    : 0;

  // 성장률 계산 (첫날 대비 마지막날)
  const growthRate = allDays.length >= 2 && allDays[0].pageviews > 0
    ? ((allDays[allDays.length - 1].pageviews - allDays[0].pageviews) / allDays[0].pageviews) * 100
    : 0;

  // 변동성 (표준편차)
  const variance = pageviewValues.length > 0
    ? pageviewValues.reduce((sum, val) => sum + Math.pow(val - avgPageviews, 2), 0) / pageviewValues.length
    : 0;
  const volatility = Math.sqrt(variance);

  // 2. Top 데이터 제한 (상위 10개)
  const topPages = (dashboardData.topPages || []).slice(0, 10);
  const topPosts = (dashboardData.topPosts || []).slice(0, 10).map((p: any) => ({
    ...p,
    title: (p.title || '').substring(0, 80), // 최대 80자
  }));
  const topReferrers = (dashboardData.topReferrers || []).slice(0, 10);

  // 3. SEO 문제 포스트 샘플 (10개만)
  const postsWithIssuesSample = (dashboardData.seoStatus?.quality?.postsWithIssues || []).slice(0, 10).map((p: any) => ({
    ...p,
    title: (p.title || '').substring(0, 80), // 최대 80자
  }));

  // 4. 히트맵 데이터 제한 (상위 5개)
  const heatmapData = dashboardData.heatmapData
    ? {
        topClickedElements: (dashboardData.heatmapData.topClickedElements || []).slice(0, 5),
        pageClickStats: (dashboardData.heatmapData.pageClickStats || []).slice(0, 5),
      }
    : null;

  // 5. 최근 활동 (PII 제거, 집계만)
  const supabase = getServerSupabase();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 최근 발행 포스트
  const { count: recentPostsCount, data: recentPostsData } = await supabase
    .from('uslab_posts')
    .select('published_at')
    .eq('is_published', true)
    .gte('published_at', sevenDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(1);

  // 최근 댓글
  const { count: totalCommentsCount } = await supabase
    .from('uslab_comments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  const { count: approvedCommentsCount } = await supabase
    .from('uslab_comments')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', true)
    .gte('created_at', sevenDaysAgo.toISOString());

  const { data: latestComment } = await supabase
    .from('uslab_comments')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  // 최근 문의
  const { count: totalInquiriesCount, data: inquiriesData } = await supabase
    .from('uslab_inquiries')
    .select('status, created_at', { count: 'exact' })
    .gte('created_at', sevenDaysAgo.toISOString());

  const statusDistribution = {
    pending: inquiriesData?.filter((i: any) => i.status === 'pending').length || 0,
    contacted: inquiriesData?.filter((i: any) => i.status === 'contacted').length || 0,
    completed: inquiriesData?.filter((i: any) => i.status === 'completed').length || 0,
  };

  const latestInquiry = inquiriesData && inquiriesData.length > 0
    ? (inquiriesData as any[]).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  // 6. 참여도 집계
  const engagementSummary = await calculateEngagementSummary(prefix, startDate, endDate);

  // 7. 사전 계산 신호값
  const computedSignals = await calculateComputedSignals(
    prefix,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate
  );

  // 이전 기간 데이터 (비교용)
  let previousPeriodData: any = null;
  if (previousStartDate && previousEndDate && dashboardData.comparison) {
    const previousDailyStats = await getDailyStatsByRange(previousStartDate, previousEndDate, prefix);
    const previousPageviewValues = previousDailyStats.map((d) => d.pageviews);
    const previousAvgPageviews = previousPageviewValues.length > 0
      ? previousPageviewValues.reduce((a, b) => a + b, 0) / previousPageviewValues.length
      : 0;
    const previousTotalPageviews = previousPageviewValues.reduce((a, b) => a + b, 0);
    const previousTotalUniques = previousDailyStats.reduce((sum, d) => sum + d.uniques, 0);

    previousPeriodData = {
      period: {
        startDate: previousStartDate.toISOString(),
        endDate: previousEndDate.toISOString(),
        days: Math.ceil((previousEndDate.getTime() - previousStartDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
      stats: {
        totalPageviews: previousTotalPageviews,
        totalUniques: previousTotalUniques,
        avgPageviews: Math.round(previousAvgPageviews * 100) / 100,
      },
      dailyStats: {
        summary: {
          avgPageviews: Math.round(previousAvgPageviews * 100) / 100,
          maxPageviews: previousPageviewValues.length > 0 ? Math.max(...previousPageviewValues) : 0,
          minPageviews: previousPageviewValues.length > 0 ? Math.min(...previousPageviewValues) : 0,
        },
      },
    };
  }

  // AI 입력 데이터 구성
  const aiInput = {
    reportType: dashboardData.dateRange ? 'custom' : 'daily',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
    },
    sitePrefix: prefix,
    stats: dashboardData.stats,
    dailyStats: {
      last7Days,
      last30DaysSummary: {
        avgPageviews: Math.round(avgPageviews * 100) / 100,
        maxPageviews,
        minPageviews,
        avgUniques: Math.round(avgUniques * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
      },
    },
    topPages,
    topPosts,
    topReferrers,
    seoStatus: {
      technical: dashboardData.seoStatus?.technical || {},
      quality: {
        ...dashboardData.seoStatus?.quality,
        postsWithIssuesSample,
      },
    },
    heatmapData,
    webVitalsData: dashboardData.webVitalsData,
    engagementSummary,
    computedSignals,
    recentActivity: {
      posts: {
        count: recentPostsCount || 0,
        latestPublishedAt: recentPostsData && recentPostsData.length > 0
          ? (recentPostsData[0] as any).published_at
          : null,
      },
      comments: {
        totalCount: totalCommentsCount || 0,
        approvedCount: approvedCommentsCount || 0,
        pendingCount: (totalCommentsCount || 0) - (approvedCommentsCount || 0),
        latestCreatedAt: latestComment && latestComment.length > 0 ? (latestComment[0] as any).created_at : null,
      },
      inquiries: {
        totalCount: totalInquiriesCount || 0,
        statusDistribution,
        latestCreatedAt: latestInquiry ? latestInquiry.created_at : null,
      },
    },
    ...(previousPeriodData ? { previousPeriod: previousPeriodData } : {}),
    ...(dashboardData.comparison ? { comparison: dashboardData.comparison } : {}),
  };

  // 입력 해시 생성 (캐싱용)
  const inputString = JSON.stringify(aiInput);
  const hash = createHash('sha256').update(inputString).digest('hex');

  return {
    input: aiInput,
    hash,
  };
}


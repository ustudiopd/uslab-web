'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  todayPageviews: number;
  todayUniques: number;
  last7Days: { pageviews: number; uniques: number };
  last30Days: { pageviews: number; uniques: number };
}

interface TopPage {
  page_path: string;
  pageviews: number;
  uniques: number;
}

interface TopPost {
  post_id: string;
  title: string;
  locale: string;
  pageviews: number;
  uniques: number;
}

interface TopReferrer {
  referrer_host: string | null;
  sessions: number;
}

interface RecentActivity {
  posts: Array<{ id: string; title: string; published_at: string | null }>;
  comments: Array<{ id: string; author_name: string; created_at: string }>;
  inquiries: Array<{ id: string; name: string; status: string; created_at: string }>;
}

interface DailyStat {
  day: string;
  pageviews: number;
  uniques: number;
}

interface PostWithIssue {
  id: string;
  title: string;
  slug: string;
  locale: string;
  issues: string[];
}

interface SEOStatus {
  technical: {
    hasSitemap: boolean;
    hasRobots: boolean;
    hasCanonical: boolean;
    hasJsonLd: boolean;
  };
  quality: {
    totalPublished: number;
    missingSeoTitle: number;
    missingSeoDescription: number;
    seoTitleTooLong: number;
    seoDescriptionTooLong: number;
    postsWithIssues?: PostWithIssue[];
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [dailyStats7, setDailyStats7] = useState<DailyStat[]>([]);
  const [dailyStats30, setDailyStats30] = useState<DailyStat[]>([]);
  const [chartRange, setChartRange] = useState<7 | 30>(7);
  const [seoStatus, setSeoStatus] = useState<SEOStatus | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setTopPages(data.topPages || []);
      setTopPosts(data.topPosts || []);
      setTopReferrers(data.topReferrers || []);
      setRecentActivity(data.recentActivity || null);
      setDailyStats7(data.dailyStats?.last7Days || []);
      setDailyStats30(data.dailyStats?.last30Days || []);
      setSeoStatus(data.seoStatus || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <p className="text-slate-400 text-sm sm:text-base">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight sm:leading-normal">
          대시보드
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">콘텐츠 운영 현황 및 트래픽 분석</p>
      </div>

        {/* KPI 카드 */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-slate-400 mb-1">총 포스트</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalPosts}</div>
              <div className="text-xs text-slate-500 mt-1">
                발행: {stats.publishedPosts} | 초안: {stats.draftPosts}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-slate-400 mb-1">오늘 방문자</div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{stats.todayUniques}</div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.todayPageviews}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-slate-400 mb-1">최근 7일</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400">
                {stats.last7Days.uniques}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.last7Days.pageviews}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-slate-400 mb-1">최근 30일</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                {stats.last30Days.uniques}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.last30Days.pageviews}
              </div>
            </div>
          </div>
        )}

        {/* 트래픽 추이 차트 */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">트래픽 추이</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartRange(7)}
                className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  chartRange === 7
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                7일
              </button>
              <button
                onClick={() => setChartRange(30)}
                className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  chartRange === 30
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                30일
              </button>
            </div>
          </div>
          {chartRange === 7 && dailyStats7.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="페이지뷰"
                  dot={{ fill: '#06b6d4', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="uniques"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="방문자"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : chartRange === 30 && dailyStats30.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="페이지뷰"
                  dot={{ fill: '#06b6d4', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="uniques"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="방문자"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              데이터가 없습니다.
            </div>
          )}
        </div>

        {/* SEO 상태 박스 */}
        {seoStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* 기술적 SEO */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">기술적 SEO</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Sitemap</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasSitemap
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {seoStatus.technical.hasSitemap ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Robots.txt</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasRobots
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {seoStatus.technical.hasRobots ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Canonical URL</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasCanonical
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {seoStatus.technical.hasCanonical ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">JSON-LD</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasJsonLd
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {seoStatus.technical.hasJsonLd ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* 포스트 SEO 품질 */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">포스트 SEO 품질</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">발행 포스트</span>
                  <span className="text-sm text-white font-medium">
                    {seoStatus.quality.totalPublished}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">SEO 제목 누락</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.missingSeoTitle > 0
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {seoStatus.quality.missingSeoTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">SEO 설명 누락</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.missingSeoDescription > 0
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {seoStatus.quality.missingSeoDescription}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">제목 길이 초과 (60자)</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.seoTitleTooLong > 0 ? 'text-yellow-400' : 'text-green-400'
                    }`}
                  >
                    {seoStatus.quality.seoTitleTooLong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">설명 길이 초과 (160자)</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.seoDescriptionTooLong > 0
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {seoStatus.quality.seoDescriptionTooLong}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO 문제 포스트 목록 */}
        {seoStatus && seoStatus.quality.postsWithIssues && seoStatus.quality.postsWithIssues.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-white mb-4">
              SEO 문제 포스트 ({seoStatus.quality.postsWithIssues.length}개)
            </h2>
            <div className="space-y-2">
              {seoStatus.quality.postsWithIssues.map((post) => {
                const issueLabels: Record<string, string> = {
                  missing_title: '제목 누락',
                  missing_description: '설명 누락',
                  title_too_long: '제목 초과',
                  description_too_long: '설명 초과',
                };

                return (
                  <Link
                    key={post.id}
                    href={`/admin/posts/${post.id}`}
                    className="block p-3 rounded border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate mb-1">
                          {post.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.issues.map((issue) => (
                            <span
                              key={issue}
                              className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400"
                            >
                              {issueLabels[issue] || issue}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {post.locale === 'ko' ? '한국어' : 'English'} • {post.slug}
                        </div>
                      </div>
                      <div className="text-xs text-cyan-400 whitespace-nowrap">편집 →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 콘텐츠 및 Referrer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top Posts */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-4">인기 포스트 (30일)</h2>
            {topPosts.length === 0 ? (
              <p className="text-sm text-slate-400">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {topPosts.slice(0, 10).map((post) => (
                  <div
                    key={post.post_id}
                    className="flex items-start justify-between gap-2 p-2 rounded hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{post.title}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {post.locale === 'ko' ? '한국어' : 'English'} • 조회수: {post.pageviews} • 방문자: {post.uniques}
                      </div>
                    </div>
                    <Link
                      href={`/admin/posts/${post.post_id}`}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      보기
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Referrers */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-4">유입 경로 (30일)</h2>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-slate-400">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {topReferrers.slice(0, 10).map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-sm text-slate-300 truncate flex-1">
                      {ref.referrer_host || '(direct)'}
                    </div>
                    <div className="text-xs text-slate-400">{ref.sessions}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        {recentActivity && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 최근 발행 포스트 */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">최근 발행 포스트</h2>
              {recentActivity.posts.length === 0 ? (
                <p className="text-sm text-slate-400">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/admin/posts/${post.id}`}
                      className="block p-2 rounded hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-white truncate">{post.title}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('ko-KR')
                          : '미발행'}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 댓글 */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">최근 댓글</h2>
              {recentActivity.comments.length === 0 ? (
                <p className="text-sm text-slate-400">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2 rounded hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-sm text-white">{comment.author_name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 문의 */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">최근 문의</h2>
              {recentActivity.inquiries.length === 0 ? (
                <p className="text-sm text-slate-400">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="p-2 rounded hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-sm text-white">{inquiry.name}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            inquiry.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : inquiry.status === 'contacted'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {inquiry.status === 'completed'
                            ? '완료'
                            : inquiry.status === 'contacted'
                            ? '연락완료'
                            : '대기'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

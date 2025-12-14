'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

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

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <p className="text-slate-400 text-sm sm:text-base">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20">
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

        {/* 네비게이션 링크 */}
        <div className="mt-6 sm:mt-8 flex flex-wrap gap-2">
          <Link
            href="/admin/posts"
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded hover:border-cyan-500 transition-colors text-sm"
          >
            포스트 관리
          </Link>
          <Link
            href="/admin/about"
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded hover:border-cyan-500 transition-colors text-sm"
          >
            소개 페이지
          </Link>
        </div>
      </div>
    </div>
  );
}

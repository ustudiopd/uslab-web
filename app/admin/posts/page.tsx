'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { UslabPost } from '@/lib/types/blog';

export default function AdminPostsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [posts, setPosts] = useState<UslabPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?all=true');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts(); // 목록 새로고침
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight sm:leading-normal">포스트 관리</h1>
            <p className="text-xs sm:text-sm text-slate-400">블로그 포스트를 작성하고 관리하세요.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded text-xs sm:text-sm hover:border-slate-600 transition-colors"
            >
              로그아웃
            </button>
            <Link
              href="/admin/posts/write"
              className="px-4 sm:px-6 py-2 sm:py-3 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors text-xs sm:text-sm text-center"
            >
              새 포스트 작성
            </Link>
          </div>
        </div>

        {/* 포스트 목록 */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-4">아직 포스트가 없습니다.</p>
            <Link
              href="/admin/posts/write"
              className="text-cyan-500 hover:text-cyan-400"
            >
              첫 포스트 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white break-words">{post.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          post.is_published
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {post.is_published ? '발행됨' : '초안'}
                      </span>
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 whitespace-nowrap">
                        {post.locale === 'ko' ? '한국어' : 'English'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-2 break-all">
                      Slug: <code className="text-cyan-500">{post.slug}</code>
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-500">
                      <span>생성: {formatDate(post.created_at)}</span>
                      {post.published_at && (
                        <span>발행: {formatDate(post.published_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded hover:border-cyan-500 transition-colors text-xs sm:text-sm whitespace-nowrap"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs sm:text-sm whitespace-nowrap"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


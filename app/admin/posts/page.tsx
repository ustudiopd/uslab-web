'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import type { UslabPost } from '@/lib/types/blog';

interface OrphanFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
}

export default function AdminPostsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [posts, setPosts] = useState<UslabPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGarbageModal, setShowGarbageModal] = useState(false);
  const [orphanFiles, setOrphanFiles] = useState<OrphanFile[]>([]);
  const [garbageLoading, setGarbageLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        fetchPosts(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error || '알 수 없는 오류'}`);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleOpenGarbageModal = async () => {
    setShowGarbageModal(true);
    setGarbageLoading(true);
    setOrphanFiles([]);
    setSelectedFiles(new Set());

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/garbage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrphanFiles(data.orphanFiles || []);
      } else {
        const error = await response.json();
        alert(`미아 이미지 조회 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error fetching orphan files:', error);
      alert('미아 이미지 조회 중 오류가 발생했습니다.');
    } finally {
      setGarbageLoading(false);
    }
  };

  const handleToggleFileSelection = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === orphanFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(orphanFiles.map(f => f.path)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('삭제할 파일을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedFiles.size}개의 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/garbage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paths: Array.from(selectedFiles),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.deletedCount}개의 파일이 삭제되었습니다.`);
        // 목록 새로고침
        await handleOpenGarbageModal();
      } else {
        const error = await response.json();
        alert(`파일 삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <p className="text-slate-600 text-sm sm:text-base">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2 leading-tight sm:leading-normal">포스트 관리</h1>
            <p className="text-xs sm:text-sm text-slate-600">블로그 포스트를 작성하고 관리하세요.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <button
              onClick={handleOpenGarbageModal}
              className="px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-600 rounded font-medium hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              가비지 관리
            </button>
            <Link
              href="/admin/posts/write"
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-xs sm:text-sm text-center"
            >
              새 포스트 작성
            </Link>
          </div>
        </div>

        {/* 포스트 목록 */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg mb-4">아직 포스트가 없습니다.</p>
            <Link
              href="/admin/posts/write"
              className="text-blue-600 hover:text-blue-700"
            >
              첫 포스트 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 hover:border-slate-300 transition-colors shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 break-words">{post.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          post.is_published
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {post.is_published ? '발행됨' : '초안'}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700 whitespace-nowrap">
                        {post.locale === 'ko' ? '한국어' : 'English'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm mb-2 break-all">
                      Slug: <code className="text-blue-600">{post.slug}</code>
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-500">
                      <span>생성: {formatDate(post.created_at)}</span>
                      {post.published_at && (
                        <span>발행: {formatDate(post.published_at)}</span>
                      )}
                      <span>조회수: {post.view_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="px-3 sm:px-4 py-2 bg-slate-100 border border-slate-300 text-slate-900 rounded hover:border-blue-500 transition-colors text-xs sm:text-sm whitespace-nowrap"
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

      {/* 가비지 관리 모달 */}
      {showGarbageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">가비지 관리 - 미아 이미지</h2>
              <button
                onClick={() => setShowGarbageModal(false)}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {garbageLoading ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">미아 이미지를 검색 중...</p>
                </div>
              ) : orphanFiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 text-lg mb-2">미아 이미지가 없습니다!</p>
                  <p className="text-slate-500 text-sm">모든 이미지가 포스트에서 사용 중입니다.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      총 {orphanFiles.length}개의 미아 이미지 발견
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded hover:border-slate-400 transition-colors"
                      >
                        {selectedFiles.size === orphanFiles.length ? '전체 해제' : '전체 선택'}
                      </button>
                      {selectedFiles.size > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          disabled={deleting}
                          className="px-3 py-1.5 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {deleting ? '삭제 중...' : `선택 삭제 (${selectedFiles.size})`}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {orphanFiles.map((file) => (
                      <div
                        key={file.path}
                        className={`flex items-center gap-3 p-3 rounded border ${
                          selectedFiles.has(file.path)
                            ? 'bg-yellow-500/10 border-yellow-500/50'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.path)}
                          onChange={() => handleToggleFileSelection(file.path)}
                          className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 truncate font-mono">{file.name}</p>
                          <p className="text-xs text-slate-600">
                            {formatFileSize(file.size)} • {formatDate(file.created_at)}
                          </p>
                        </div>
                        <img
                          src={supabase.storage.from('uslab-images').getPublicUrl(file.path).data.publicUrl}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-4 sm:p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowGarbageModal(false)}
                className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-900 rounded hover:border-slate-400 transition-colors text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}





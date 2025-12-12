'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { EditorRoot, EditorContent, StarterKit } from 'novel';
import type { UslabPost } from '@/lib/types/blog';
import type { JSONContent } from 'novel';

export default function EditPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const [post, setPost] = useState<UslabPost | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const { post: postData } = await response.json();
        setPost(postData);
        setTitle(postData.title);
        setSlug(postData.slug);
        setLocale(postData.locale);
        setContent(postData.content);
      } else {
        const error = await response.json();
        alert(`포스트를 불러올 수 없습니다: ${error.error || '알 수 없는 오류'}`);
        router.push('/admin/posts');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('포스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (publish: boolean) => {
    if (!title || !slug || !content) {
      alert('제목, slug, 내용을 모두 입력해주세요.');
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          locale,
          is_published: publish,
          published_at: publish ? new Date().toISOString() : post?.published_at,
        }),
      });

      if (response.ok) {
        alert(publish ? '포스트가 발행되었습니다.' : '포스트가 저장되었습니다.');
        fetchPost(); // 최신 데이터 다시 로드
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('포스트가 삭제되었습니다.');
        router.push('/admin/posts');
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    if (post) {
      // 원본 데이터로 되돌리기
      setTitle(post.title);
      setSlug(post.slug);
      setLocale(post.locale);
      setContent(post.content);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 중
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight sm:leading-normal">포스트 편집</h1>
            <div className="flex gap-2 flex-wrap self-start sm:self-center">
              <button
                onClick={() => router.push('/admin/posts')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                목록
              </button>
              <button
                onClick={handleDelete}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                삭제
              </button>
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="mb-4">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                post.is_published
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {post.is_published ? '발행됨' : '초안'}
            </span>
          </div>

          {/* 제목 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="포스트 제목을 입력하세요"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Slug 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Slug (URL 경로)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ai-trend-2025"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* 언어 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              언어
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ko"
                  checked={locale === 'ko'}
                  onChange={(e) => setLocale(e.target.value as 'ko' | 'en')}
                  className="mr-2"
                />
                <span className="text-slate-300">한국어</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="en"
                  checked={locale === 'en'}
                  onChange={(e) => setLocale(e.target.value as 'ko' | 'en')}
                  className="mr-2"
                />
                <span className="text-slate-300">English</span>
              </label>
            </div>
          </div>
        </div>

        {/* 에디터 */}
        <div className="mb-6 sm:mb-8 bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 lg:p-6 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <EditorRoot>
            <EditorContent
              initialContent={content || undefined}
              extensions={[StarterKit]}
              onUpdate={({ editor }) => {
                const json = editor.getJSON();
                setContent(json);
              }}
              editorProps={{
                attributes: {
                  class: 'prose prose-invert max-w-none focus:outline-none min-h-[350px] sm:min-h-[450px] lg:min-h-[500px] prose-sm sm:prose-base',
                },
              }}
            />
          </EditorRoot>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            onClick={handleCancel}
            disabled={isSaving || isPublishing}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded font-medium hover:border-slate-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            취소
          </button>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => handleUpdate(false)}
              disabled={isSaving || isPublishing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 text-white rounded font-medium hover:border-slate-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => handleUpdate(true)}
              disabled={isSaving || isPublishing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isPublishing ? '발행 중...' : post.is_published ? '업데이트 발행' : '발행하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




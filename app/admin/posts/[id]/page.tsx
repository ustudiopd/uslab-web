'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import type { UslabPost } from '@/lib/types/blog';
import type { JSONContent } from 'novel';
import BlogEditor from '@/components/editor/BlogEditor';
import { readMarkdownFile, jsonToMarkdown, copyMarkdownToClipboard, downloadMarkdownFile } from '@/lib/utils/markdown';
import PostVersionTabs from '@/components/admin/PostVersionTabs';
import { generateContentHTML } from '@/lib/utils/generate-html';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorKey, setEditorKey] = useState(0); // 에디터 재생성을 위한 key
  const [canonicalRootId, setCanonicalRootId] = useState<string>(''); // canonical_id 추적

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
        setThumbnailUrl(postData.thumbnail_url || '');
        setCanonicalRootId(postData.canonical_id || postData.id);
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

      // 발행 시 SEO 메타데이터 자동 생성
      let seoData = null;
      if (publish) {
        try {
          // Tiptap JSON을 HTML로 변환
          const htmlContent = generateContentHTML(content);
          
          // SEO API 호출
          const seoResponse = await fetch('/api/ai/seo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              full_content: htmlContent,
              title: title,
              locale: locale,
            }),
          });

          if (seoResponse.ok) {
            seoData = await seoResponse.json();
            console.log('SEO 메타데이터 생성 완료:', seoData);
          } else {
            console.warn('SEO 생성 실패, fallback 사용');
          }
        } catch (seoError) {
          console.error('SEO 생성 중 오류:', seoError);
          // SEO 생성 실패해도 발행은 진행 (fallback이 있으므로)
        }
      }

      // 포스트 업데이트
      const updateData: any = {
        title,
        slug,
        content,
        locale,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : post?.published_at,
      };

      // SEO 데이터가 있으면 포함
      if (seoData) {
        updateData.seo_title = seoData.seo_title;
        updateData.seo_description = seoData.seo_description;
        updateData.seo_keywords = seoData.seo_keywords;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
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

  const handleUnpublish = async () => {
    if (!confirm('발행을 취소하시겠습니까? 포스트가 초안 상태로 변경됩니다.')) {
      return;
    }

    setIsPublishing(true);
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
          is_published: false,
          published_at: null,
        }),
      });

      if (response.ok) {
        alert('발행이 취소되었습니다. 포스트가 초안 상태로 변경되었습니다.');
        fetchPost(); // 최신 데이터 다시 로드
      } else {
        const error = await response.json();
        alert(`발행 취소 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error unpublishing post:', error);
      alert('발행 취소 중 오류가 발생했습니다.');
    } finally {
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
    // 목록으로 돌아가기
    router.push('/admin/posts');
  };

  // 탭에서 포스트 변경 시 호출
  const handlePostChange = (newPost: UslabPost) => {
    setPost(newPost);
    setTitle(newPost.title);
    setSlug(newPost.slug);
    setLocale(newPost.locale);
    setContent(newPost.content);
    setThumbnailUrl(newPost.thumbnail_url || '');
    setCanonicalRootId(newPost.canonical_id || newPost.id);
    // 에디터 재생성
    setEditorKey(prev => prev + 1);
    // URL 업데이트 (새 포스트 ID로)
    router.replace(`/admin/posts/${newPost.id}`);
  };

  // Markdown Import
  const handleImportMarkdown = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const json = await readMarkdownFile(file);
      setContent(json);
      // 에디터를 재생성하여 새 내용을 반영
      setEditorKey(prev => prev + 1);
      alert('마크다운 파일을 가져왔습니다.');
    } catch (error: any) {
      console.error('Markdown import error:', error);
      alert(error.message || '마크다운 파일 가져오기에 실패했습니다.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Markdown Export (복사)
  const handleCopyMarkdown = async () => {
    if (!content) {
      alert('내용이 없습니다.');
      return;
    }

    try {
      const markdown = jsonToMarkdown(content);
      await copyMarkdownToClipboard(markdown);
      alert('마크다운이 클립보드에 복사되었습니다.');
    } catch (error: any) {
      console.error('Markdown export error:', error);
      alert(error.message || '마크다운 복사에 실패했습니다.');
    }
  };

  // Markdown Export (다운로드)
  const handleDownloadMarkdown = () => {
    if (!content) {
      alert('내용이 없습니다.');
      return;
    }

    try {
      const markdown = jsonToMarkdown(content);
      const filename = slug || title || 'post';
      downloadMarkdownFile(markdown, `${filename}.md`);
    } catch (error: any) {
      console.error('Markdown export error:', error);
      alert(error.message || '마크다운 다운로드에 실패했습니다.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-slate-600">로딩 중...</p>
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
    <div className="min-h-screen bg-slate-50 pt-16 sm:pt-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-slate-900 leading-tight">포스트 편집</h1>
            {/* 모바일: 버튼들을 세로로 배치 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              {/* Markdown Import/Export 버튼 - 모바일에서 가로 스크롤 */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible">
                <button
                  onClick={handleImportMarkdown}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
                  title="마크다운 파일 가져오기"
                >
                  Import
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  disabled={!content}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
                  title="마크다운으로 복사"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  disabled={!content}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
                  title="마크다운 다운로드"
                >
                  Download
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/admin/posts')}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 rounded hover:border-slate-400 transition-colors text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
                >
                  목록
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 sm:px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-600 rounded hover:bg-red-500/30 transition-colors text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          {/* 버전 탭 */}
          {canonicalRootId && (
            <div className="mb-4 sm:mb-6">
              <PostVersionTabs
                canonicalRootId={canonicalRootId}
                koPostId={canonicalRootId}
                initialTab={locale}
                onPostChange={handlePostChange}
              />
            </div>
          )}

          {/* 상태 표시 */}
          <div className="mb-3 sm:mb-4">
            <span
              className={`px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${
                post.is_published
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {post.is_published ? '발행됨' : '초안'}
            </span>
          </div>

          {/* 제목 입력 */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="포스트 제목을 입력하세요"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-white border border-slate-300 rounded text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Slug 입력 */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              Slug (URL 경로)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ai-trend-2025"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* 언어 표시 (읽기 전용, 탭으로 관리) */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
              언어
            </label>
            <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs sm:text-sm text-slate-700">
              {locale === 'ko' ? '한국어' : 'English'}
            </div>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
              언어는 위의 탭에서 전환할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 에디터 */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-white border border-slate-200 rounded-lg p-2 sm:p-3 lg:p-6 min-h-[350px] sm:min-h-[450px] lg:min-h-[600px] shadow-sm">
          <BlogEditor
            key={editorKey}
            editorKey={editorKey}
            initialContent={content}
            onChange={setContent}
            onSetThumbnail={setThumbnailUrl}
          />
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown"
          onChange={handleFileChange}
          className="hidden"
        />

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
            {post.is_published ? (
              <>
                <button
                  onClick={handleUnpublish}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-600 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isPublishing ? '처리 중...' : '발행 취소'}
                </button>
                <button
                  onClick={() => handleUpdate(false)}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 border border-slate-300 text-slate-900 rounded font-medium hover:border-slate-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSaving ? '저장 중...' : '초안 저장'}
                </button>
                <button
                  onClick={() => handleUpdate(true)}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isPublishing ? '발행 중...' : '업데이트 발행'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleUpdate(false)}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 border border-slate-300 text-slate-900 rounded font-medium hover:border-slate-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSaving ? '저장 중...' : '초안 저장'}
                </button>
                <button
                  onClick={() => handleUpdate(true)}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isPublishing ? '발행 중...' : '발행하기'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





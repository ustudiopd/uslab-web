'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { EditorRoot, EditorContent, StarterKit } from 'novel';
import type { JSONContent } from 'novel';

export default function WritePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  // AI Slug 생성 함수
  const generateAiSlug = async (currentTitle: string) => {
    if (!currentTitle || !currentTitle.trim()) {
      return;
    }

    setIsGeneratingSlug(true);
    try {
      const res = await fetch('/api/ai/slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: currentTitle }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Slug 생성 실패');
      }

      const data = await res.json();
      setSlug(data.slug);
    } catch (error) {
      console.error('Error generating slug:', error);
      alert('Slug 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  const handleCancel = () => {
    // 모든 입력 필드 초기화
    setTitle('');
    setSlug('');
    setLocale('ko');
    setContent(null);
    setPostId(null);
  };

  // 초안 저장
  const handleSaveDraft = async () => {
    if (!title || !slug || !content) {
      alert('제목, slug, 내용을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Supabase 세션 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      // 이미 저장된 포스트가 있으면 업데이트, 없으면 생성
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        }),
      });

      if (response.ok) {
        const { post } = await response.json();
        setPostId(post.id);
        setSaveMessage('초안이 저장되었습니다.');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || '알 수 없는 오류가 발생했습니다.';
        alert(`저장 실패: ${errorMessage}`);
        console.error('Error details:', error);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 발행
  const handlePublish = async () => {
    if (!title || !slug || !content) {
      alert('제목, slug, 내용을 모두 입력해주세요.');
      return;
    }

    setIsPublishing(true);
    try {
      // Supabase 세션 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          locale,
          is_published: true,
          published_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const { post } = await response.json();
        setPostId(post.id);
        alert('포스트가 발행되었습니다.');
        router.push(`/admin/posts/${post.id}`);
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || '알 수 없는 오류가 발생했습니다.';
        alert(`발행 실패: ${errorMessage}`);
        console.error('Error details:', error);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('발행 중 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight sm:leading-normal">
              {postId ? '포스트 편집' : '새 포스트 작성'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              {saveMessage && (
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-xs sm:text-sm whitespace-nowrap">
                  {saveMessage}
                </div>
              )}
              <button
                onClick={() => router.push('/admin/posts')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                목록
              </button>
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => {
                if (!slug && title.trim()) {
                  generateAiSlug(title);
                }
              }}
              placeholder="포스트 제목을 입력하세요"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Slug 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Slug (URL 경로)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="future-of-ai"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => generateAiSlug(title)}
                disabled={isGeneratingSlug || !title.trim()}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm"
              >
                {isGeneratingSlug ? '생성 중...' : 'AI 생성'}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              제목 입력 후 포커스를 벗어나면 자동 생성됩니다.
            </p>
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
              onClick={handleSaveDraft}
              disabled={isSaving || isPublishing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 text-white rounded font-medium hover:border-slate-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isSaving ? '저장 중...' : '초안 저장'}
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving || isPublishing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isPublishing ? '발행 중...' : '발행하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



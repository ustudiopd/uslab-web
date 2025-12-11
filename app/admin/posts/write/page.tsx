'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
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
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // slug 자동 생성 (제목 기반)
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // slug가 비어있으면 자동 생성
    if (!slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  // 초안 저장
  const handleSaveDraft = async () => {
    if (!title || !slug || !content) {
      alert('제목, slug, 내용을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert('초안이 저장되었습니다.');
        router.push(`/admin/posts/${post.id}`);
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error}`);
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
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert('포스트가 발행되었습니다.');
        router.push(`/admin/posts/${post.id}`);
      } else {
        const error = await response.json();
        alert(`발행 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('발행 중 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">새 포스트 작성</h1>

          {/* 제목 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="포스트 제목을 입력하세요"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6 min-h-[600px]">
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
                  class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
                },
              }}
            />
          </EditorRoot>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="px-6 py-3 bg-slate-800 border border-slate-700 text-white rounded font-medium hover:border-slate-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '초안 저장'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
            className="px-6 py-3 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
          >
            {isPublishing ? '발행 중...' : '발행하기'}
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import type { JSONContent } from 'novel';
import BlogEditor from '@/components/editor/BlogEditor';
import { readMarkdownFile, jsonToMarkdown, copyMarkdownToClipboard, downloadMarkdownFile } from '@/lib/utils/markdown';
import { generateContentHTML } from '@/lib/utils/generate-html';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<{ getEditor: () => any } | null>(null);
  const [editorKey, setEditorKey] = useState(0); // 에디터 재생성을 위한 key

  // AI Slug 생성 함수
  const generateAiSlug = async (currentTitle: string) => {
    if (!currentTitle || !currentTitle.trim()) {
      return;
    }

    setIsGeneratingSlug(true);
    try {
      // Supabase 세션 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/ai/slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: currentTitle }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Slug 생성 실패');
      }

      const data = await res.json();
      setSlug(data.slug);
    } catch (error: any) {
      console.error('Error generating slug:', error);
      alert(error.message || 'Slug 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  const handleCancel = () => {
    // 목록으로 돌아가기
    router.push('/admin/posts');
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
      // 파일 입력 초기화
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
        setSaveMessage('초안이 저장되었습니다. 포스트 관리에서 확인할 수 있습니다.');
        setTimeout(() => setSaveMessage(null), 5000);
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

      // SEO 메타데이터 자동 생성
      let seoData = null;
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

      // 이미 저장된 포스트가 있으면 업데이트, 없으면 생성
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';

      const postData: any = {
        title,
        slug,
        content,
        locale,
        is_published: true,
        published_at: new Date().toISOString(),
      };

      // SEO 데이터가 있으면 포함
      if (seoData) {
        postData.seo_title = seoData.seo_title;
        postData.seo_description = seoData.seo_description;
        postData.seo_keywords = seoData.seo_keywords;
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const { post } = await response.json();
        setPostId(post.id);
        alert('포스트가 발행되었습니다.');
        router.push(`/admin/posts/${post.id}`);
      } else {
        const error = await response.json();
        let errorMessage = error.error || '알 수 없는 오류가 발생했습니다.';
        
        // slug 중복 오류인 경우 더 명확한 메시지
        if (error.code === 'DUPLICATE_SLUG' || error.code === '23505' || error.error === 'Slug already exists') {
          errorMessage = `Slug 중복: ${error.details || error.hint || '같은 slug가 이미 사용 중입니다.'}\n\n기존 포스트: ${error.existingPost?.title || '알 수 없음'}\n다른 slug를 사용하거나 기존 포스트를 수정해주세요.`;
        } else if (error.details) {
          errorMessage = `${error.error}: ${error.details}`;
        }
        
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
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-white leading-tight">
              {postId ? '포스트 편집' : '새 포스트 작성'}
            </h1>
            {/* 모바일: 버튼들을 세로로 배치 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              {saveMessage && (
                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-xs sm:text-sm whitespace-nowrap self-start">
                  {saveMessage}
                </div>
              )}
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
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Slug 입력 */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              Slug (URL 경로)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="future-of-ai"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => generateAiSlug(title)}
                disabled={isGeneratingSlug || !title.trim()}
                className="px-3 sm:px-4 py-2 sm:py-2.5 sm:py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm"
              >
                {isGeneratingSlug ? '생성 중...' : 'AI 생성'}
              </button>
            </div>
            <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
              제목 입력 후 포커스를 벗어나면 자동 생성됩니다.
            </p>
          </div>

          {/* 언어 선택 */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              언어
            </label>
            <div className="flex gap-3 sm:gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ko"
                  checked={locale === 'ko'}
                  onChange={(e) => setLocale(e.target.value as 'ko' | 'en')}
                  className="mr-1.5 sm:mr-2"
                />
                <span className="text-xs sm:text-sm text-slate-300">한국어</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="en"
                  checked={locale === 'en'}
                  onChange={(e) => setLocale(e.target.value as 'ko' | 'en')}
                  className="mr-1.5 sm:mr-2"
                />
                <span className="text-xs sm:text-sm text-slate-300">English</span>
              </label>
            </div>
          </div>
        </div>

        {/* 에디터 */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-slate-900 border border-slate-800 rounded-lg p-2 sm:p-3 lg:p-6 min-h-[350px] sm:min-h-[450px] lg:min-h-[600px]">
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




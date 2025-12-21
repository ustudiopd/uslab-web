'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import type { UslabAbout } from '@/lib/types/about';
import type { JSONContent } from 'novel';
import BlogEditor from '@/components/editor/BlogEditor';
import { readMarkdownFile, jsonToMarkdown, copyMarkdownToClipboard, downloadMarkdownFile } from '@/lib/utils/markdown';
import AboutVersionTabs from '@/components/admin/AboutVersionTabs';
import { generateContentHTML } from '@/lib/utils/generate-html';

export default function AboutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const [about, setAbout] = useState<UslabAbout | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorKey, setEditorKey] = useState(0); // 에디터 재생성을 위한 key
  const [tabsKey, setTabsKey] = useState(0); // AboutVersionTabs 재생성을 위한 key

  const handleSave = async () => {
    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!about) {
      alert('언어를 선택해주세요.');
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

      // SEO 메타데이터 자동 생성
      let seoData = null;
      try {
        // Tiptap JSON을 HTML로 변환
        const htmlContent = generateContentHTML(content);
        
        // 소개 페이지 제목 (locale에 따라)
        const title = about.locale === 'ko' ? '소개 | USLab.ai' : 'About | USLab.ai';
        
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
            locale: about.locale,
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
        // SEO 생성 실패해도 저장은 진행 (fallback이 있으므로)
      }

      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locale: about.locale,
          content,
          seo_title: seoData?.seo_title,
          seo_description: seoData?.seo_description,
          seo_keywords: seoData?.seo_keywords,
        }),
      });

      if (response.ok) {
        const { about: updatedAbout } = await response.json();
        setAbout(updatedAbout);
        setContent(updatedAbout.content);
        setSaveMessage('소개 페이지가 저장되었습니다.');
        setTimeout(() => setSaveMessage(null), 5000);
        // AboutVersionTabs 재생성하여 최신 데이터 로드 (탭 상태도 업데이트, 조회수 포함)
        setTabsKey(prev => prev + 1);
      } else {
        const error = await response.json();
        alert(`저장 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Error saving about:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 탭에서 소개 페이지 변경 시 호출
  const handleAboutChange = (newAbout: UslabAbout | null) => {
    if (newAbout) {
      setAbout(newAbout);
      setContent(newAbout.content);
    } else {
      // about가 null이면 빈 상태로 설정
      setAbout(null);
      setContent(null);
    }
    // 에디터 재생성
    setEditorKey(prev => prev + 1);
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
    if (!content || !about) {
      alert('내용이 없습니다.');
      return;
    }

    try {
      const markdown = jsonToMarkdown(content);
      const filename = `about-${about.locale}`;
      downloadMarkdownFile(markdown, `${filename}.md`);
    } catch (error: any) {
      console.error('Markdown export error:', error);
      alert(error.message || '마크다운 다운로드에 실패했습니다.');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 중
  }


  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
              소개 페이지 관리
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
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 rounded hover:border-slate-400 transition-colors text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
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

          {/* 버전 탭 */}
          <div className="mb-4 sm:mb-6">
            <AboutVersionTabs
              key={tabsKey}
              initialTab={about?.locale || 'ko'}
              onAboutChange={handleAboutChange}
              refreshKey={tabsKey}
            />
          </div>

          {/* 조회수 표시 (관리자만) */}
          {about && about.view_count !== undefined && (
            <div className="mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block flex-shrink-0"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>조회수: {about.view_count.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* 에디터 */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-white border border-slate-200 rounded-lg p-2 sm:p-3 lg:p-6 min-h-[350px] sm:min-h-[450px] lg:min-h-[600px] shadow-sm">
          <BlogEditor
            key={editorKey}
            editorKey={editorKey}
            initialContent={content || undefined}
            onChange={setContent}
            onSetThumbnail={() => {}}
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
            onClick={() => router.push('/admin/posts')}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 border border-slate-300 text-slate-900 rounded font-medium hover:border-slate-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            목록으로
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !about}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
    </div>
  );
}



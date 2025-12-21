'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ExecDoc } from '@/lib/types/execBoard';
import type { JSONContent } from 'novel';
import BlogEditor from '@/components/editor/BlogEditor';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

interface ExecDocEditorProps {
  docId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExecDocEditor({ docId, onClose, onSaved }: ExecDocEditorProps) {
  const [doc, setDoc] = useState<ExecDoc | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent | null>(null);
  const [loading, setLoading] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 자동저장
  const { saveStatus, lastSaved, triggerSave, restoreFromLocal } = useAutoSave({
    docId,
    debounceMs: 2000,
    onSave: async (savedContent: JSONContent, savedTitle?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`/api/admin/exec-docs/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: savedTitle || title,
          content: savedContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장 실패');
      }

      onSaved();
    },
  });

  useEffect(() => {
    fetchDoc();
  }, [docId]);

  // 로컬 백업에서 복원 (페이지 로드 시)
  useEffect(() => {
    if (!doc && !loading) {
      const backup = restoreFromLocal();
      if (backup.content) {
        setContent(backup.content);
        if (backup.title) {
          setTitle(backup.title);
        }
      }
    }
  }, [doc, loading, restoreFromLocal]);

  const fetchDoc = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-docs/${docId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoc(data.doc);
        setTitle(data.doc.title);
        setContent(data.doc.content || {});
      }
    } catch (error) {
      console.error('Error fetching doc:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (content) {
      triggerSave(content, newTitle);
    }
  };

  const handleContentChange = (newContent: JSONContent) => {
    setContent(newContent);
    triggerSave(newContent, title);
  };

  const handleDelete = async () => {
    if (!confirm('이 문서를 휴지통으로 이동하시겠습니까?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-docs/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        onSaved();
        onClose();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting doc:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <p className="text-slate-600">문서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[calc(100vh-180px)] shadow-sm">
      {/* 상단 바 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
        >
          ← 목록으로
        </button>

        <div className="flex items-center gap-4">
          {/* 저장 상태 */}
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === 'saving' && (
              <span className="text-yellow-600">저장 중...</span>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <span className="text-green-600">
                저장됨 {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600">저장 실패</span>
            )}
            {saveStatus === 'offline' && (
              <span className="text-slate-600">오프라인 - 동기화 대기 중</span>
            )}
          </div>

          {/* 액션 버튼 */}
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs bg-red-500/20 border border-red-500/50 text-red-600 rounded hover:bg-red-500/30 transition-colors"
          >
            휴지통으로
          </button>
        </div>
      </div>

      {/* 제목 입력 */}
      <div className="p-4 border-b border-slate-200">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="제목을 입력하세요..."
          className="w-full bg-transparent text-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* 에디터 */}
      <div className="flex-1 overflow-y-auto p-4">
        <BlogEditor
          initialContent={content}
          onChange={handleContentChange}
          editorKey={docId}
        />
      </div>
    </div>
  );
}


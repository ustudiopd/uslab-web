'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import type { ExecBoard, ExecDoc } from '@/lib/types/execBoard';
import ExecDocList from './ExecDocList';
import ExecDocEditor from './ExecDocEditor';

export default function ExecBoardTab() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [boardId, setBoardId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docs, setDocs] = useState<ExecDoc[]>([]);
  const [topDoc, setTopDoc] = useState<ExecDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // URL에서 doc 파라미터 읽기
  const urlDocId = searchParams.get('doc');

  useEffect(() => {
    // 기본 보드(첫 번째 보드) 가져오기
    fetchDefaultBoard();
  }, []);

  useEffect(() => {
    if (urlDocId) {
      setSelectedDocId(urlDocId);
    }
  }, [urlDocId]);

  useEffect(() => {
    if (boardId) {
      fetchDocs(boardId);
      fetchTopDoc(boardId);
    }
  }, [boardId]);

  const fetchDefaultBoard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/exec-boards', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const boards = data.boards || [];
        // 첫 번째 보드를 기본으로 사용
        if (boards.length > 0) {
          setBoardId(boards[0].id);
        } else {
          // 보드가 없으면 생성
          const createResponse = await fetch('/api/admin/exec-boards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              name: '운영진 보드',
              description: '운영진 내부 문서 및 공지',
            }),
          });
          if (createResponse.ok) {
            const createData = await createResponse.json();
            setBoardId(createData.board.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching default board:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async (boardId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-boards/${boardId}/docs?trashed=false`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocs(data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching docs:', error);
    }
  };

  const fetchTopDoc = async (boardId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-boards/${boardId}/top`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTopDoc(data.doc);
      }
    } catch (error) {
      console.error('Error fetching top doc:', error);
    }
  };

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    const params = new URLSearchParams();
    params.set('doc', docId);
    router.push(`/admin/exec-board?${params.toString()}`);
  };

  const handleDocClose = () => {
    setSelectedDocId(null);
    router.push('/admin/exec-board');
  };

  const handleDocSaved = () => {
    if (boardId) {
      fetchDocs(boardId);
      fetchTopDoc(boardId);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  // 문서가 선택되면 편집기만 표시, 아니면 목록만 표시
  if (selectedDocId) {
    return (
      <div>
        <ExecDocEditor
          docId={selectedDocId}
          onClose={handleDocClose}
          onSaved={handleDocSaved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 최상단 하이라이트 카드 */}
      {topDoc && (
        <div
          onClick={() => handleDocSelect(topDoc.id)}
          className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-lg p-6 cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-mono text-cyan-400 mb-2">최상단 하이라이트</div>
              <h3 className="text-xl font-bold text-white mb-2">{topDoc.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">
                {/* 요약 텍스트는 추후 추가 */}
              </p>
              <div className="text-xs text-slate-500 mt-3">
                마지막 수정: {new Date(topDoc.updated_at).toLocaleString('ko-KR')}
              </div>
            </div>
            <div className="text-cyan-400">→</div>
          </div>
        </div>
      )}

      {/* 문서 목록 */}
      <ExecDocList
        boardId={boardId}
        docs={docs}
        onDocSelect={handleDocSelect}
        onRefresh={() => boardId && fetchDocs(boardId)}
      />
    </div>
  );
}


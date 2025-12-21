'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ExecDoc } from '@/lib/types/execBoard';

interface ExecTrashViewProps {
  boardId: string;
  onClose: () => void;
  onRestored: () => void;
}

export default function ExecTrashView({ boardId, onClose, onRestored }: ExecTrashViewProps) {
  const [trashedDocs, setTrashedDocs] = useState<ExecDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchTrashedDocs();
  }, [boardId]);

  const fetchTrashedDocs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-boards/${boardId}/docs?trashed=true`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrashedDocs(data.docs || []);
      }
    } catch (error) {
      console.error('Error fetching trashed docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (docId: string) => {
    setRestoring(docId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/exec-docs/${docId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        onRestored();
        fetchTrashedDocs();
      } else {
        const error = await response.json();
        alert(`복원 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error restoring doc:', error);
      alert('복원 중 오류가 발생했습니다.');
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">휴지통</h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded hover:border-slate-400 transition-colors"
        >
          ← 목록으로
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-slate-600">로딩 중...</p>
        </div>
      ) : trashedDocs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-600">휴지통이 비어있습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashedDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 opacity-60 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-slate-900 mb-1 truncate">
                    {doc.title}
                  </h3>
                  <div className="text-xs text-slate-600">
                    삭제됨: {doc.trashed_at ? new Date(doc.trashed_at).toLocaleString('ko-KR') : '-'}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(doc.id)}
                  disabled={restoring === doc.id}
                  className="px-3 py-1.5 text-xs bg-green-500/20 border border-green-500/50 text-green-600 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  {restoring === doc.id ? '복원 중...' : '복원'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


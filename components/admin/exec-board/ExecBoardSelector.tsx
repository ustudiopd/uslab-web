'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ExecBoard, CreateBoardData } from '@/lib/types/execBoard';

interface ExecBoardSelectorProps {
  boards: ExecBoard[];
  selectedBoardId: string | null;
  onBoardChange: (boardId: string) => void;
  onBoardCreated: () => void;
  onBoardDeleted: () => void;
}

export default function ExecBoardSelector({
  boards,
  selectedBoardId,
  onBoardChange,
  onBoardCreated,
  onBoardDeleted,
}: ExecBoardSelectorProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      alert('보드 이름을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const boardData: CreateBoardData = {
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || undefined,
        sort_order: boards.length,
      };

      const response = await fetch('/api/admin/exec-boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(boardData),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewBoardName('');
        setNewBoardDescription('');
        onBoardCreated();
        onBoardChange(data.board.id);
      } else {
        const error = await response.json();
        alert(`보드 생성 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
      alert('보드 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (!confirm(`"${boardName}" 보드를 삭제하시겠습니까?\n\n주의: 보드에 포함된 모든 문서도 함께 삭제됩니다.`)) {
      return;
    }

    setDeleting(boardId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/admin/exec-boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        onBoardDeleted();
        // 삭제된 보드가 선택되어 있었다면 첫 번째 보드로 변경
        if (selectedBoardId === boardId) {
          const remainingBoards = boards.filter((b) => b.id !== boardId);
          if (remainingBoards.length > 0) {
            onBoardChange(remainingBoards[0].id);
          }
        }
      } else {
        const error = await response.json();
        alert(`보드 삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('보드 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* 보드 선택 드롭다운 */}
      <div className="flex items-center gap-2">
        <select
          value={selectedBoardId || ''}
          onChange={(e) => onBoardChange(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:border-blue-500"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        
        {/* 보드 삭제 버튼 */}
        {selectedBoardId && boards.length > 1 && (
          <button
            onClick={() => {
              const selectedBoard = boards.find((b) => b.id === selectedBoardId);
              if (selectedBoard) {
                handleDeleteBoard(selectedBoardId, selectedBoard.name);
              }
            }}
            disabled={deleting === selectedBoardId}
            className="px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="보드 삭제"
          >
            {deleting === selectedBoardId ? '삭제 중...' : '🗑️'}
          </button>
        )}
      </div>

      {/* 새 보드 버튼 */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        + 새 보드
      </button>

      {/* 새 보드 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">새 보드 생성</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">보드 이름 *</label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="예: 공지, 회의록"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">설명 (선택)</label>
                <input
                  type="text"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="보드 설명"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBoardName('');
                    setNewBoardDescription('');
                  }}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-900 rounded text-sm hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? '생성 중...' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


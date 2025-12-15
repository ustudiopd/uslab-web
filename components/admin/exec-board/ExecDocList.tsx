'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase/client';
import type { ExecDoc } from '@/lib/types/execBoard';
import ExecTrashView from './ExecTrashView';

interface ExecDocListProps {
  boardId: string | null;
  docs: ExecDoc[];
  onDocSelect: (docId: string) => void;
  onRefresh: () => void;
}

// 정렬 가능한 문서 아이템 컴포넌트
function SortableDocItem({
  doc,
  onSelect,
  onDelete,
  deleting,
}: {
  doc: ExecDoc;
  onSelect: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doc.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* 드래그 핸들 */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4" cy="4" r="1.5" fill="currentColor" />
              <circle cx="12" cy="4" r="1.5" fill="currentColor" />
              <circle cx="4" cy="8" r="1.5" fill="currentColor" />
              <circle cx="12" cy="8" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white mb-1 truncate">{doc.title}</h3>
            <div className="text-xs text-slate-400">
              {new Date(doc.updated_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-all disabled:opacity-50"
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </div>
  );
}

export default function ExecDocList({
  boardId,
  docs,
  onDocSelect,
  onRefresh,
}: ExecDocListProps) {
  const [showTrash, setShowTrash] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [localDocs, setLocalDocs] = useState<ExecDoc[]>(docs);
  const [reordering, setReordering] = useState(false);

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // docs가 변경되면 localDocs 업데이트 (정렬 중이 아닐 때만)
  useEffect(() => {
    if (!reordering) {
      setLocalDocs(docs);
    }
  }, [docs, reordering]);

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !boardId) {
      return;
    }

    const oldIndex = localDocs.findIndex((doc) => doc.id === active.id);
    const newIndex = localDocs.findIndex((doc) => doc.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
    const newDocs = arrayMove(localDocs, oldIndex, newIndex);
    setLocalDocs(newDocs);
    setReordering(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인이 필요합니다.');
      }

      // 순서대로 doc ID 배열 생성
      const orderedDocIds = newDocs.map((doc) => doc.id);

      const response = await fetch(`/api/admin/exec-boards/${boardId}/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderedDocIds,
        }),
      });

      if (!response.ok) {
        // 실패 시 원래 상태로 복원
        setLocalDocs(docs);
        const error = await response.json();
        alert(`정렬 실패: ${error.error}`);
      } else {
        // 성공 시 서버에서 최신 데이터 가져오기
        onRefresh();
      }
    } catch (error) {
      console.error('Error reordering docs:', error);
      // 실패 시 원래 상태로 복원
      setLocalDocs(docs);
      alert('정렬 중 오류가 발생했습니다.');
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('이 문서를 휴지통으로 이동하시겠습니까?')) {
      return;
    }

    setDeleting(docId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/admin/exec-docs/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting doc:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  if (!boardId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">보드를 선택해주세요.</p>
      </div>
    );
  }

  if (showTrash) {
    return (
      <ExecTrashView
        boardId={boardId}
        onClose={() => setShowTrash(false)}
        onRestored={onRefresh}
      />
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">문서 목록</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTrash(true)}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors"
          >
            휴지통
          </button>
          <button
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`/api/admin/exec-boards/${boardId}/docs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  title: '새 문서',
                }),
              });

              if (response.ok) {
                const data = await response.json();
                onRefresh();
                onDocSelect(data.doc.id);
              }
            }}
            className="px-4 py-2 bg-cyan-500 text-white rounded text-sm font-medium hover:bg-cyan-600 transition-colors"
          >
            + 새 문서
          </button>
        </div>
      </div>

      {/* 문서 리스트 */}
      {docs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">문서가 없습니다.</p>
          <button
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`/api/admin/exec-boards/${boardId}/docs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  title: '새 문서',
                }),
              });

              if (response.ok) {
                const data = await response.json();
                onRefresh();
                onDocSelect(data.doc.id);
              }
            }}
            className="text-cyan-500 hover:text-cyan-400"
          >
            첫 문서 작성하기
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={localDocs.map((doc) => doc.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {localDocs.map((doc) => (
                <SortableDocItem
                  key={doc.id}
                  doc={doc}
                  onSelect={() => onDocSelect(doc.id)}
                  onDelete={() => handleDelete(doc.id)}
                  deleting={deleting === doc.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}


'use client';

interface DiffViewProps {
  original: string;
  suggested: string;
  reason: string;
  diff?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffView({
  original,
  suggested,
  reason,
  diff,
  onAccept,
  onReject,
}: DiffViewProps) {
  return (
    <div className="diff-view space-y-4">
      {/* 원본 */}
      <div className="original">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">원본</h4>
        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-300 whitespace-pre-wrap">
          {original}
        </div>
      </div>

      {/* 제안 */}
      <div className="suggested">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">AI 제안</h4>
        <div className="p-3 bg-cyan-900/20 border border-cyan-700 rounded text-sm text-cyan-100 whitespace-pre-wrap">
          {suggested}
        </div>
      </div>

      {/* 수정 이유 */}
      {reason && (
        <div className="reason">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">수정 이유</h4>
          <div className="p-3 bg-slate-800/30 border border-slate-700 rounded text-sm text-slate-400">
            {reason}
          </div>
        </div>
      )}

      {/* 변경 사항 요약 */}
      {diff && (
        <div className="diff-summary">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">변경 사항</h4>
          <div className="p-3 bg-slate-800/30 border border-slate-700 rounded text-sm text-slate-400">
            {diff}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="actions flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-lg hover:from-cyan-600 hover:to-indigo-600 transition-all text-sm font-medium"
        >
          수락
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-all text-sm font-medium"
        >
          거절
        </button>
      </div>
    </div>
  );
}







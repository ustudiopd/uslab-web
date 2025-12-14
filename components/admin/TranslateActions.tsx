'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface TranslateActionsProps {
  sourcePostId: string;
  targetPostId?: string;
  hasEnPost: boolean;
  onTranslationComplete: (targetPostId?: string) => void;
}

export default function TranslateActions({
  sourcePostId,
  targetPostId,
  hasEnPost,
  onTranslationComplete,
}: TranslateActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRebaseModal, setShowRebaseModal] = useState(false);
  const [updateStrategy, setUpdateStrategy] = useState<'text_only' | 'rebase_from_ko'>('text_only');

  const handleTranslate = async (mode: 'create' | 'update', strategy?: 'text_only' | 'rebase_from_ko') => {
    try {
      setLoading(true);
      setError(null);

      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/ai/translate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourcePostId,
          targetLocale: 'en',
          mode,
          updateStrategy: strategy || 'text_only',
          translateSeo: true,
          preserveSlug: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 409 에러: 구조 mismatch
        if (response.status === 409) {
          setError(
            `${data.details}\n\n${data.suggestion || ''}\n\nrebase_from_ko 전략을 사용하시겠습니까?`
          );
          setShowRebaseModal(true);
          return;
        }

        setError(data.details || data.error || '번역 중 오류가 발생했습니다.');
        return;
      }

      // 성공
      const targetPostId = data.targetPostId;
      alert('번역이 완료되었습니다.');
      onTranslationComplete(targetPostId);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : '번역 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    handleTranslate('create');
  };

  const handleUpdate = () => {
    if (updateStrategy === 'rebase_from_ko') {
      if (!confirm('KO 구조로 EN을 완전히 재생성합니다. EN에서 변경한 이미지도 KO 이미지로 되돌아갑니다. 계속하시겠습니까?')) {
        return;
      }
    }
    handleTranslate('update', updateStrategy);
  };

  const handleRebaseConfirm = () => {
    setShowRebaseModal(false);
    setUpdateStrategy('rebase_from_ko');
    handleUpdate();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {!hasEnPost ? (
        // EN이 없을 때: Create 버튼
        <div>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {loading ? '번역 중...' : '영문 번역으로 초안 생성'}
          </button>
        </div>
      ) : (
        // EN이 있을 때: Update 버튼
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {loading ? '업데이트 중...' : '자동 번역 업데이트'}
            </button>
            <button
              onClick={() => {
                if (confirm('KO 구조로 EN을 완전히 재생성합니다. EN에서 변경한 이미지도 KO 이미지로 되돌아갑니다. 계속하시겠습니까?')) {
                  handleTranslate('update', 'rebase_from_ko');
                }
              }}
              disabled={loading}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              KO 구조로 재생성
            </button>
          </div>
          <div className="text-xs sm:text-sm text-slate-400 space-y-1.5 sm:space-y-2">
            <label className="flex items-start sm:items-center gap-2">
              <input
                type="radio"
                checked={updateStrategy === 'text_only'}
                onChange={() => setUpdateStrategy('text_only')}
                className="text-cyan-500 mt-0.5 sm:mt-0 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm">텍스트만 업데이트 (기본, EN 이미지 유지)</span>
            </label>
            <label className="flex items-start sm:items-center gap-2">
              <input
                type="radio"
                checked={updateStrategy === 'rebase_from_ko'}
                onChange={() => setUpdateStrategy('rebase_from_ko')}
                className="text-yellow-500 mt-0.5 sm:mt-0 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm">KO 구조로 재생성 (EN 이미지도 KO로 변경됨)</span>
            </label>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs sm:text-sm">
          <p className="font-medium mb-1 sm:mb-2">오류:</p>
          <p className="whitespace-pre-line break-words">{error}</p>
          {error.includes('rebase_from_ko') && (
            <button
              onClick={handleRebaseConfirm}
              className="mt-2 sm:mt-3 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm"
            >
              rebase_from_ko로 재시도
            </button>
          )}
        </div>
      )}

      {/* Rebase 확인 모달 */}
      {showRebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">구조 불일치</h3>
            <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
              EN 텍스트 노드 수와 KO 텍스트 노드 수가 다릅니다. KO 구조로 EN을 완전히 재생성하시겠습니까?
            </p>
            <p className="text-yellow-400 text-xs sm:text-sm mb-3 sm:mb-4">
              ⚠️ EN에서 변경한 이미지도 KO 이미지로 되돌아갑니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleRebaseConfirm}
                className="flex-1 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm"
              >
                재생성
              </button>
              <button
                onClick={() => {
                  setShowRebaseModal(false);
                  setError(null);
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors text-xs sm:text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


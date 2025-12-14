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
    <div className="space-y-4">
      {!hasEnPost ? (
        // EN이 없을 때: Create 버튼
        <div>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '번역 중...' : '영문 번역으로 초안 생성'}
          </button>
        </div>
      ) : (
        // EN이 있을 때: Update 버튼
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-4 py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              KO 구조로 재생성
            </button>
          </div>
          <div className="text-sm text-slate-400">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={updateStrategy === 'text_only'}
                onChange={() => setUpdateStrategy('text_only')}
                className="text-cyan-500"
              />
              <span>텍스트만 업데이트 (기본, EN 이미지 유지)</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                checked={updateStrategy === 'rebase_from_ko'}
                onChange={() => setUpdateStrategy('rebase_from_ko')}
                className="text-yellow-500"
              />
              <span>KO 구조로 재생성 (EN 이미지도 KO로 변경됨)</span>
            </label>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
          <p className="font-medium mb-2">오류:</p>
          <p className="whitespace-pre-line">{error}</p>
          {error.includes('rebase_from_ko') && (
            <button
              onClick={handleRebaseConfirm}
              className="mt-3 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
            >
              rebase_from_ko로 재시도
            </button>
          )}
        </div>
      )}

      {/* Rebase 확인 모달 */}
      {showRebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">구조 불일치</h3>
            <p className="text-slate-300 mb-4">
              EN 텍스트 노드 수와 KO 텍스트 노드 수가 다릅니다. KO 구조로 EN을 완전히 재생성하시겠습니까?
            </p>
            <p className="text-yellow-400 text-sm mb-4">
              ⚠️ EN에서 변경한 이미지도 KO 이미지로 되돌아갑니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRebaseConfirm}
                className="flex-1 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
              >
                재생성
              </button>
              <button
                onClick={() => {
                  setShowRebaseModal(false);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-slate-600 transition-colors"
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

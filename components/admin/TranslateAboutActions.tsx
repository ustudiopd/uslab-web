'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface TranslateAboutActionsProps {
  hasEnAbout: boolean;
  onTranslationComplete: () => void;
}

export default function TranslateAboutActions({
  hasEnAbout,
  onTranslationComplete,
}: TranslateAboutActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      const response = await fetch('/api/ai/translate-about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetLocale: 'en',
          mode,
          updateStrategy: strategy || 'text_only',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 409 에러: 구조 mismatch
        if (response.status === 409) {
          setError(
            `${data.details}\n\n${data.suggestion || ''}\n\nrebase_from_ko 전략을 사용하시겠습니까?`
          );
          return;
        }

        setError(data.details || data.error || '번역 중 오류가 발생했습니다.');
        return;
      }

      // 성공
      alert('번역이 완료되었습니다.');
      onTranslationComplete();
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {!hasEnAbout ? (
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
        </div>
      )}
    </div>
  );
}


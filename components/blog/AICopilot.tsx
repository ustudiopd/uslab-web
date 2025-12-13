'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import DiffView from './DiffView';

interface AICopilotProps {
  selectedText: string;
  onApply: (suggestedText: string) => void;
  locale?: 'ko' | 'en';
  postId?: string;
}

interface RefineResponse {
  original: string;
  suggested: string;
  reason: string;
  diff: string;
}

export default function AICopilot({ selectedText, onApply, locale = 'ko', postId }: AICopilotProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<RefineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefine = async () => {
    if (!selectedText || selectedText.trim().length === 0) {
      setError('선택된 텍스트가 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      // 인증 토큰 가져오기
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: selectedText,
          locale,
          post_id: postId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 교정 요청 실패');
      }

      const data: RefineResponse = await response.json();
      setSuggestion(data);
    } catch (err: any) {
      console.error('AI refine error:', err);
      setError(err.message || 'AI 교정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onApply(suggestion.suggested);
      setSuggestion(null);
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  if (!selectedText || selectedText.trim().length === 0) {
    return null;
  }

  return (
    <div className="ai-copilot-panel border border-slate-700 rounded-lg p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-200">AI 교정</h3>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {!suggestion && (
        <button
          onClick={handleRefine}
          disabled={loading}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-lg hover:from-cyan-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI 교정 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>AI로 교정하기</span>
            </>
          )}
        </button>
      )}

      {suggestion && (
        <DiffView
          original={suggestion.original}
          suggested={suggestion.suggested}
          reason={suggestion.reason}
          diff={suggestion.diff}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
}







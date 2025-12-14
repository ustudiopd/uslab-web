'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UslabAbout } from '@/lib/types/about';
import TranslateAboutActions from './TranslateAboutActions';

interface AboutVersionTabsProps {
  initialTab?: 'ko' | 'en';
  onAboutChange?: (about: UslabAbout | null) => void;
  refreshKey?: number; // 외부에서 새로고침을 트리거하기 위한 key
}

export default function AboutVersionTabs({
  initialTab = 'ko',
  onAboutChange,
  refreshKey = 0,
}: AboutVersionTabsProps) {
  const [activeTab, setActiveTab] = useState<'ko' | 'en'>(initialTab);
  const [koAbout, setKoAbout] = useState<UslabAbout | null>(null);
  const [enAbout, setEnAbout] = useState<UslabAbout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAbouts();
  }, [refreshKey]);

  // 로딩 완료 후 초기 탭에 해당하는 about 전달
  useEffect(() => {
    if (!onAboutChange || loading) return;
    
    // 로딩 완료 후 초기 탭에 해당하는 about 전달
    if (activeTab === 'ko') {
      onAboutChange(koAbout);
    } else if (activeTab === 'en') {
      onAboutChange(enAbout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // loading이 false가 되면 한 번만 호출

  // activeTab이나 about가 변경될 때 onAboutChange 호출
  useEffect(() => {
    if (!onAboutChange || loading) return;
    
    if (activeTab === 'ko') {
      onAboutChange(koAbout);
    } else if (activeTab === 'en') {
      onAboutChange(enAbout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, koAbout, enAbout]);

  const loadAbouts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      // KO 소개 페이지 로드
      const koResponse = await fetch(`/api/about?locale=ko`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!koResponse.ok) {
        throw new Error('KO 소개 페이지를 불러올 수 없습니다.');
      }

      const { about: koAboutData } = await koResponse.json();
      setKoAbout(koAboutData);

      // EN 소개 페이지 로드
      const enResponse = await fetch(`/api/about?locale=en`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!enResponse.ok) {
        throw new Error('EN 소개 페이지를 불러올 수 없습니다.');
      }

      const { about: enAboutData } = await enResponse.json();
      setEnAbout(enAboutData);
    } catch (err) {
      console.error('Error loading abouts:', err);
      setError(err instanceof Error ? err.message : '소개 페이지를 불러오는 중 오류가 발생했습니다.');
      setKoAbout(null);
      setEnAbout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationComplete = async () => {
    try {
      setLoading(true);
      
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      // EN 소개 페이지 다시 로드
      const enResponse = await fetch(`/api/about?locale=en`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (enResponse.ok) {
        const { about: enAboutData } = await enResponse.json();
        setEnAbout(enAboutData);
        setActiveTab('en');
        if (onAboutChange) {
          onAboutChange(enAboutData);
        }
      }
    } catch (err) {
      console.error('Error loading EN about after translation:', err);
      setError('EN 소개 페이지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentAbout = activeTab === 'ko' ? koAbout : enAbout;

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-400">
            한국어
          </div>
          <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-400">
            English
          </div>
        </div>
        <p className="text-slate-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 sm:mb-6">
      {/* 탭 UI */}
      <div className="flex gap-2 mb-3 sm:mb-4">
        <button
          onClick={() => {
            setActiveTab('ko');
            if (onAboutChange) {
              onAboutChange(koAbout);
            }
          }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-medium transition-colors text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'ko'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>한국어</span>
          {koAbout ? (
            <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              저장됨
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              없음
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('en');
            if (onAboutChange) {
              onAboutChange(enAbout);
            }
          }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-medium transition-colors text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'en'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>English</span>
          {enAbout ? (
            <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              저장됨
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              없음
            </span>
          )}
        </button>
      </div>

      {/* EN 탭에서 번역 액션 */}
      {activeTab === 'en' && (
        <div className="mb-3 sm:mb-4">
          <TranslateAboutActions
            hasEnAbout={!!enAbout}
            onTranslationComplete={handleTranslationComplete}
          />
        </div>
      )}

      {/* 현재 선택된 소개 페이지 정보 표시 */}
      {activeTab === 'en' && !enAbout && (
        <div className="p-3 sm:p-4 bg-slate-800/50 border border-slate-700 rounded mb-3 sm:mb-4">
          <p className="text-slate-300 mb-2 sm:mb-3 text-sm sm:text-base">영문 버전이 아직 없습니다.</p>
          <p className="text-slate-400 text-xs sm:text-sm">
            아래 버튼을 클릭하여 KO 소개 페이지를 기반으로 EN 초안을 생성할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}


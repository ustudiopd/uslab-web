'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UslabPost } from '@/lib/types/blog';
import TranslateActions from './TranslateActions';

interface PostVersionTabsProps {
  canonicalRootId: string;
  koPostId: string;
  initialTab?: 'ko' | 'en';
  onPostChange?: (post: UslabPost) => void;
}

export default function PostVersionTabs({
  canonicalRootId,
  koPostId,
  initialTab = 'ko',
  onPostChange,
}: PostVersionTabsProps) {
  const [activeTab, setActiveTab] = useState<'ko' | 'en'>(initialTab);
  const [koPost, setKoPost] = useState<UslabPost | null>(null);
  const [enPost, setEnPost] = useState<UslabPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [canonicalRootId, koPostId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      // KO 포스트 로드
      const koResponse = await fetch(`/api/posts/${koPostId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!koResponse.ok) {
        throw new Error('KO 포스트를 불러올 수 없습니다.');
      }

      const { post: koPostData } = await koResponse.json();
      setKoPost(koPostData);

      // EN 포스트 로드 (canonical_id로 검색)
      const canonicalId = koPostData.canonical_id || koPostData.id;
      
      // 모든 포스트 목록에서 EN 포스트 찾기 (API 사용)
      const allPostsResponse = await fetch(`/api/posts?all=true&lang=en`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (allPostsResponse.ok) {
        const { posts } = await allPostsResponse.json();
        const enPostData = posts.find((p: UslabPost) => 
          (p.canonical_id || p.id) === canonicalId && p.locale === 'en'
        );
        
        if (enPostData) {
          setEnPost(enPostData);
          // EN 포스트가 로드되었고 현재 탭이 EN이면 편집 화면에 로드
          if (activeTab === 'en' && onPostChange) {
            onPostChange(enPostData);
          }
        } else {
          setEnPost(null);
        }
      } else {
        // API 실패 시 null로 설정 (EN이 없는 것으로 간주)
        setEnPost(null);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : '포스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationComplete = async (targetPostId?: string) => {
    try {
      setLoading(true);
      
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인이 필요합니다.');
        return;
      }

      // targetPostId가 있으면 해당 포스트를 직접 로드
      if (targetPostId) {
        const response = await fetch(`/api/posts/${targetPostId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const { post } = await response.json();
          setEnPost(post);
          setActiveTab('en');
          if (onPostChange) {
            onPostChange(post);
          }
          setLoading(false);
          return;
        }
      }

      // targetPostId가 없으면 전체 목록에서 찾기
      const canonicalId = koPost?.canonical_id || koPost?.id || canonicalRootId;
      
      const allPostsResponse = await fetch(`/api/posts?all=true&lang=en`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (allPostsResponse.ok) {
        const { posts } = await allPostsResponse.json();
        const enPostData = posts.find((p: UslabPost) => 
          (p.canonical_id || p.id) === canonicalId && p.locale === 'en'
        );
        
        if (enPostData) {
          setEnPost(enPostData);
          setActiveTab('en');
          if (onPostChange) {
            onPostChange(enPostData);
          }
        }
      }
    } catch (err) {
      console.error('Error loading EN post after translation:', err);
      setError('EN 포스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentPost = activeTab === 'ko' ? koPost : enPost;

  if (loading) {
    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-2 mb-3 sm:mb-4">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded text-xs sm:text-sm text-slate-400">
            한국어
          </div>
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded text-xs sm:text-sm text-slate-400">
            English
          </div>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded text-xs sm:text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!koPost) {
    return (
      <div className="mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs sm:text-sm text-yellow-400">
          KO 포스트를 찾을 수 없습니다.
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
            if (koPost && onPostChange) {
              onPostChange(koPost);
            }
          }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-medium transition-colors text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'ko'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>한국어</span>
          {koPost.is_published ? (
            <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              발행됨
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
              초안
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('en');
            if (enPost && onPostChange) {
              onPostChange(enPost);
            } else if (onPostChange) {
              // EN이 없으면 KO를 전달 (빈 상태 처리)
              onPostChange(koPost);
            }
          }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-medium transition-colors text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'en'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>English</span>
          {enPost ? (
            enPost.is_published ? (
              <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
                발행됨
              </span>
            ) : (
              <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px] sm:text-xs whitespace-nowrap">
                초안
              </span>
            )
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
          <TranslateActions
            sourcePostId={koPost.id}
            targetPostId={enPost?.id}
            hasEnPost={!!enPost}
            onTranslationComplete={handleTranslationComplete}
          />
        </div>
      )}

      {/* 현재 선택된 포스트 정보 표시 */}
      {activeTab === 'en' && !enPost && (
        <div className="p-3 sm:p-4 bg-slate-800/50 border border-slate-700 rounded mb-3 sm:mb-4">
          <p className="text-slate-300 mb-2 sm:mb-3 text-sm sm:text-base">영문 버전이 아직 없습니다.</p>
          <p className="text-slate-400 text-xs sm:text-sm">
            아래 버튼을 클릭하여 KO 포스트를 기반으로 EN 초안을 생성할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}


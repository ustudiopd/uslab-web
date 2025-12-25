'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { parseUTM, parseLocaleFromPath } from '@/lib/utils/tracking';
import {
  getSessionStorageKey,
  getLastSeenStorageKey,
  ANALYTICS_ENABLED,
  ANALYTICS_EXCLUDE_PATH_PREFIXES,
  ANALYTICS_RESPECT_DNT,
} from '@/lib/config/analytics';
import {
  eventQueue,
  scrollTracker,
  trackClick,
} from '@/lib/utils/eventTracker';

/**
 * 세션 만료 시간 (30분)
 */
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Tracker 컴포넌트
 * 
 * Public 영역에서만 동작하며, 라우팅 변화마다 페이지뷰를 추적합니다.
 * - sendBeacon을 사용하여 fire-and-forget 방식으로 전송
 * - 세션 키는 30분 만료
 * - UTM 파라미터 및 Referrer 자동 추적
 */
export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionKeyRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const currentPageViewIdRef = useRef<string | null>(null);

  /**
   * 세션 키 생성 또는 갱신
   */
  const getOrCreateSessionKey = (): string => {
    // 이미 메모리에 있으면 반환
    if (sessionKeyRef.current) {
      return sessionKeyRef.current;
    }

    // localStorage에서 확인
    const STORAGE_KEY_SESSION = getSessionStorageKey();
    const STORAGE_KEY_LAST_SEEN = getLastSeenStorageKey();
    const storedKey = localStorage.getItem(STORAGE_KEY_SESSION);
    const lastSeen = localStorage.getItem(STORAGE_KEY_LAST_SEEN);

    // 세션이 없거나 만료되었으면 새로 생성
    if (
      !storedKey ||
      !lastSeen ||
      Date.now() - parseInt(lastSeen) > SESSION_EXPIRY_MS
    ) {
      const newKey = crypto.randomUUID();
      sessionKeyRef.current = newKey;
      localStorage.setItem(STORAGE_KEY_SESSION, newKey);
      localStorage.setItem(STORAGE_KEY_LAST_SEEN, Date.now().toString());
      return newKey;
    }

    // 기존 세션 유지
    sessionKeyRef.current = storedKey;
    localStorage.setItem(STORAGE_KEY_LAST_SEEN, Date.now().toString());
    return storedKey;
  };

  /**
   * 페이지뷰 트래킹 전송
   */
  const trackPageView = () => {
    // Analytics 비활성화 시 제외
    if (!ANALYTICS_ENABLED) {
      return;
    }

    // Do Not Track 존중
    if (
      ANALYTICS_RESPECT_DNT &&
      typeof navigator !== 'undefined' &&
      navigator.doNotTrack === '1'
    ) {
      return;
    }

    // 제외 경로 확인
    const isExcluded = ANALYTICS_EXCLUDE_PATH_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (isExcluded) {
      return;
    }

    try {
      const sessionKey = getOrCreateSessionKey();
      const locale = parseLocaleFromPath(pathname);
      const referrer = typeof document !== 'undefined' ? document.referrer : null;

      // UTM 파라미터 파싱
      const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
      const utm = parseUTM(fullUrl);

      // page_view_id 클라이언트에서 생성 (v2)
      const pageViewId = crypto.randomUUID();
      currentPageViewIdRef.current = pageViewId;

      // page_path 정규화: pathname만 저장 (query 제외)
      const canonicalPath = pathname;

      // 이벤트 큐에 페이지뷰 설정
      eventQueue.setPageView(pageViewId, canonicalPath);
      
      // 스크롤 추적 시작
      scrollTracker.start(pageViewId, canonicalPath);

      // post_id 추출 (page_path에서 slug 파싱 후 조회는 서버에서)
      // 클라이언트에서는 post_id를 직접 알 수 없으므로 null로 전송
      // 서버에서 page_path를 분석하여 post_id를 매핑할 수 있음 (선택사항)

      const payload = {
        session_key: sessionKey,
        page_view: {
          id: pageViewId,
          page_path: canonicalPath,
          locale: locale,
          referrer: referrer,
          utm: utm,
        },
        post_id: null, // 서버에서 매핑 가능하면 추가
        about_id: null, // 서버에서 매핑 가능하면 추가
        events: [], // Phase 1에서 사용
      };

      // sendBeacon 우선 사용 (fire-and-forget)
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', blob);
      } else {
        // Fallback: fetch with keepalive
        fetch('/api/track', {
          method: 'POST',
          body: JSON.stringify(payload),
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // 에러는 무시 (UX 영향 없음)
        });
      }
    } catch (error) {
      // 에러는 무시 (UX 영향 없음)
      console.error('Tracker error:', error);
    }
  };

  /**
   * 클릭 이벤트 리스너
   */
  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      trackClick(
        event,
        currentPageViewIdRef.current,
        pathname
      );
    };

    // Capture phase로 리스너 등록 (모든 클릭 캡처)
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('click', handleClick, true);
    };
  }, [pathname]);

  /**
   * 라우팅 변화 감지 및 트래킹
   */
  useEffect(() => {
    // 이전 페이지 종료 처리
    if (isInitializedRef.current && currentPageViewIdRef.current) {
      scrollTracker.end();
    }

    // 초기 로드 시 약간의 지연 후 트래킹 (페이지 로드 완료 대기)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const timer = setTimeout(() => {
        trackPageView();
      }, 100);
      return () => {
        clearTimeout(timer);
        // 컴포넌트 언마운트 시 스크롤 추적 종료
        if (currentPageViewIdRef.current) {
          scrollTracker.end();
        }
      };
    } else {
      // 라우팅 변화 시 즉시 트래킹
      trackPageView();
    }
  }, [pathname, searchParams]);

  /**
   * 페이지 언로드 시 마지막 트래킹 전송
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 스크롤 추적 종료
      if (currentPageViewIdRef.current) {
        scrollTracker.end();
      }

      // 이벤트 큐 flush
      eventQueue.flush();

      // 마지막 페이지뷰 전송 (가능하면)
      if (navigator.sendBeacon) {
        const sessionKey = getOrCreateSessionKey();
        const locale = parseLocaleFromPath(pathname);
        const referrer = document.referrer;
        const utm = parseUTM(window.location.href);

        const pageViewId = crypto.randomUUID();
        const payload = {
          session_key: sessionKey,
          page_view: {
            id: pageViewId,
            page_path: pathname, // 정규화된 pathname만
            locale: locale,
            referrer: referrer,
            utm: utm,
          },
          post_id: null,
          about_id: null,
          events: [],
        };

        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/track', blob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 탭 숨김 시 flush
        if (currentPageViewIdRef.current) {
          scrollTracker.end();
        }
        eventQueue.flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}



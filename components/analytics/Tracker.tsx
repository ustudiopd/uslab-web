'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { parseUTM, parseLocaleFromPath } from '@/lib/utils/tracking';

/**
 * 세션 만료 시간 (30분)
 */
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/**
 * localStorage 키
 */
const STORAGE_KEY_SESSION = 'uslab_sid';
const STORAGE_KEY_LAST_SEEN = 'uslab_sid_last';

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

  /**
   * 세션 키 생성 또는 갱신
   */
  const getOrCreateSessionKey = (): string => {
    // 이미 메모리에 있으면 반환
    if (sessionKeyRef.current) {
      return sessionKeyRef.current;
    }

    // localStorage에서 확인
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
    // Admin, API, _next 경로는 제외
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next')
    ) {
      return;
    }

    try {
      const sessionKey = getOrCreateSessionKey();
      const locale = parseLocaleFromPath(pathname);
      const referrer = typeof document !== 'undefined' ? document.referrer : null;

      // UTM 파라미터 파싱
      const search = searchParams.toString();
      const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
      const utm = parseUTM(fullUrl);

      // post_id 추출 (page_path에서 slug 파싱 후 조회는 서버에서)
      // 클라이언트에서는 post_id를 직접 알 수 없으므로 null로 전송
      // 서버에서 page_path를 분석하여 post_id를 매핑할 수 있음 (선택사항)

      const payload = {
        session_key: sessionKey,
        page_path: pathname + (search ? `?${search}` : ''),
        post_id: null, // 서버에서 매핑 가능하면 추가
        about_id: null, // 서버에서 매핑 가능하면 추가
        locale: locale,
        referrer: referrer,
        utm: utm,
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
   * 라우팅 변화 감지 및 트래킹
   */
  useEffect(() => {
    // 초기 로드 시 약간의 지연 후 트래킹 (페이지 로드 완료 대기)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const timer = setTimeout(() => {
        trackPageView();
      }, 100);
      return () => clearTimeout(timer);
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
      // 마지막 페이지뷰 전송 (가능하면)
      if (navigator.sendBeacon) {
        const sessionKey = getOrCreateSessionKey();
        const locale = parseLocaleFromPath(pathname);
        const referrer = document.referrer;
        const utm = parseUTM(window.location.href);

        const payload = {
          session_key: sessionKey,
          page_path: pathname,
          post_id: null,
          about_id: null,
          locale: locale,
          referrer: referrer,
          utm: utm,
        };

        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/track', blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}


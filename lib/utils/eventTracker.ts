/**
 * 이벤트 수집 유틸리티
 * 클릭, 스크롤, 전환 이벤트를 수집하고 배치 전송
 */

import {
  ANALYTICS_ENABLED,
  ANALYTICS_SAMPLE_RATE_EVENTS,
  ANALYTICS_SAMPLE_RATE_HEATMAP,
  ANALYTICS_PREFIX,
  getSessionStorageKey,
} from '@/lib/config/analytics';

/**
 * 이벤트 타입
 */
export type EventName = 'click' | 'scroll_depth' | 'conversion' | 'page_engagement' | 'web_vital';

/**
 * 이벤트 인터페이스
 */
export interface Event {
  id: string;
  name: EventName;
  page_view_id: string | null;
  page_path: string;
  props: Record<string, any>;
  client_ts: number;
}

/**
 * 이벤트 큐
 */
class EventQueue {
  private queue: Event[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5초
  private readonly FLUSH_SIZE = 20; // 20개 이상 쌓이면 전송
  private currentPageViewId: string | null = null;
  private currentPagePath: string = '';

  /**
   * 현재 페이지뷰 ID 설정
   */
  setPageView(pageViewId: string, pagePath: string) {
    this.currentPageViewId = pageViewId;
    this.currentPagePath = pagePath;
    // 페이지 변경 시 큐 flush
    this.flush();
  }

  /**
   * 현재 페이지뷰 ID 가져오기
   */
  getCurrentPageViewId(): string | null {
    return this.currentPageViewId;
  }

  /**
   * 현재 페이지 경로 가져오기
   */
  getCurrentPagePath(): string {
    return this.currentPagePath;
  }

  /**
   * 이벤트 추가
   */
  add(event: Omit<Event, 'id' | 'client_ts'>) {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    // 샘플링 체크 (세션 단위)
    const sessionKey = this.getSessionKey();
    if (sessionKey && !this.shouldSample(event.name, sessionKey)) {
      return;
    }

    const fullEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      client_ts: Date.now(),
      page_view_id: event.page_view_id || this.currentPageViewId,
      page_path: event.page_path || this.currentPagePath,
    };

    this.queue.push(fullEvent);

    // 큐 크기 체크
    if (this.queue.length >= this.FLUSH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      // 타이머 시작
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.FLUSH_INTERVAL);
    }
  }

  /**
   * 이벤트 전송
   */
  async flush() {
    if (this.queue.length === 0) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // sendBeacon으로 전송
    const sessionKey = this.getSessionKey();
    if (!sessionKey) {
      return;
    }

    // events만 전송하는 payload (page_view 없음)
    const payload = {
      session_key: sessionKey,
      events: events,
    };

    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', blob);
    } else {
      fetch('/api/track', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // 에러는 무시
      });
    }
  }

  /**
   * 샘플링 체크
   */
  private shouldSample(eventName: EventName, sessionKey: string): boolean {
    // 세션 키 해시
    let hash = 0;
    for (let i = 0; i < sessionKey.length; i++) {
      hash = ((hash << 5) - hash) + sessionKey.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashValue = Math.abs(hash) % 100;

    // 이벤트 타입별 샘플링 비율
    const sampleRate = eventName === 'click' 
      ? ANALYTICS_SAMPLE_RATE_HEATMAP 
      : ANALYTICS_SAMPLE_RATE_EVENTS;

    return hashValue < sampleRate * 100;
  }

  /**
   * 세션 키 가져오기
   */
  private getSessionKey(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    // Tracker에서 설정한 세션 키 가져오기
    const key = getSessionStorageKey();
    return localStorage.getItem(key);
  }
}

// 싱글톤 인스턴스
export const eventQueue = new EventQueue();

/**
 * 클릭 이벤트 수집
 */
export function trackClick(
  event: MouseEvent,
  pageViewId: string | null,
  pagePath: string
) {
  const target = event.target as HTMLElement;
  
  // 입력 요소 무시
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return;
  }

  // data-analytics-ignore 체크
  if (target.closest('[data-analytics-ignore]')) {
    return;
  }

  // 좌표 정규화 (0~1)
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const x = event.clientX / viewportW;
  const y = event.clientY / viewportH;

  // element_id 추출 (data-analytics-id 우선)
  const elementId = target.closest('[data-analytics-id]')?.getAttribute('data-analytics-id') || null;

  eventQueue.add({
    name: 'click',
    page_view_id: pageViewId,
    page_path: pagePath,
    props: {
      x,
      y,
      viewport_w: viewportW,
      viewport_h: viewportH,
      element_id: elementId,
      element_tag: target.tagName.toLowerCase(),
      href_host: (target as HTMLAnchorElement).href 
        ? new URL((target as HTMLAnchorElement).href).hostname 
        : null,
    },
  });
}

/**
 * 스크롤 깊이 추적
 */
class ScrollTracker {
  private maxScrollPct = 0;
  private pageViewId: string | null = null;
  private pagePath = '';
  private scrollListener: (() => void) | null = null;

  /**
   * 페이지 시작
   */
  start(pageViewId: string, pagePath: string) {
    this.pageViewId = pageViewId;
    this.pagePath = pagePath;
    this.maxScrollPct = 0;

    // 스크롤 리스너
    this.scrollListener = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = docHeight > 0 ? scrollTop / docHeight : 0;
      this.maxScrollPct = Math.max(this.maxScrollPct, scrollPct);
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  /**
   * 페이지 종료 시 전송
   */
  end() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }

    if (this.maxScrollPct > 0 && this.pageViewId) {
      eventQueue.add({
        name: 'scroll_depth',
        page_view_id: this.pageViewId,
        page_path: this.pagePath,
        props: {
          max_scroll_pct: Math.round(this.maxScrollPct * 100) / 100, // 소수점 2자리
        },
      });
    }

    // flush
    eventQueue.flush();
  }
}

export const scrollTracker = new ScrollTracker();

/**
 * 전환 이벤트 추적 (개발자가 직접 호출)
 */
export function trackConversion(
  key: string,
  value?: number,
  meta?: Record<string, any>,
  pageViewId?: string | null,
  pagePath?: string
) {
  eventQueue.add({
    name: 'conversion',
    page_view_id: pageViewId || null,
    page_path: pagePath || '',
    props: {
      key,
      value,
      ...meta,
    },
  });
}

/**
 * 페이지 참여도 추적 (view_duration, scroll_depth)
 */
export function trackPageEngagement(
  viewDurationSec: number,
  scrollDepthPct: number,
  pageViewId: string | null,
  pagePath: string
) {
  eventQueue.add({
    name: 'page_engagement',
    page_view_id: pageViewId,
    page_path: pagePath,
    props: {
      view_duration_sec: viewDurationSec,
      scroll_depth_pct: scrollDepthPct,
    },
  });
}







'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { eventQueue } from '@/lib/utils/eventTracker';
import { ANALYTICS_ENABLED } from '@/lib/config/analytics';

/**
 * Web Vitals 수집 컴포넌트
 * Next.js의 useReportWebVitals를 사용하여 성능 메트릭 수집
 */
export default function WebVitals() {
  const pathname = usePathname();
  const reportedMetricsRef = useRef<Set<string>>(new Set());

  // 페이지 변경 시 중복 보고 방지 Set 초기화
  useEffect(() => {
    reportedMetricsRef.current.clear();
  }, [pathname]);

  useReportWebVitals((metric) => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    // 동일한 메트릭 중복 보고 방지 (같은 페이지에서 여러 번 보고되는 경우)
    const metricKey = `${metric.name}-${pathname}`;
    if (reportedMetricsRef.current.has(metricKey)) {
      return;
    }
    reportedMetricsRef.current.add(metricKey);

    // Tracker에서 설정한 현재 페이지뷰 ID 가져오기
    const pageViewId = eventQueue.getCurrentPageViewId();
    const pagePath = eventQueue.getCurrentPagePath() || pathname;

    // Web Vitals 이벤트 수집
    eventQueue.add({
      name: 'web_vital',
      page_view_id: pageViewId,
      page_path: pagePath,
      props: {
        name: metric.name, // LCP, CLS, INP, FCP, TTFB 등
        value: metric.value, // 숫자 값 (밀리초 또는 점수)
        rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
        id: metric.id, // 고유 ID
        delta: metric.delta, // 이전 값과의 차이
        navigationType: metric.navigationType, // 'navigate' | 'reload' | 'back-forward' | 'prerender'
      },
    });
  });

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}


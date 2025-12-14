/**
 * 트래킹 관련 유틸리티 함수
 * - Bot 필터링
 * - Device 타입 파싱
 * - UTM 파라미터 파싱
 * - Referrer 호스트 파싱
 */

/**
 * User-Agent 기반 봇 필터링
 * @param userAgent User-Agent 문자열
 * @returns 봇이면 true, 아니면 false
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;

  const ua = userAgent.toLowerCase();
  const botPatterns = [
    'googlebot',
    'bingbot',
    'slurp', // Yahoo
    'duckduckbot',
    'yandexbot',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'slackbot',
    'linkedinbot',
    'telegrambot',
    'whatsapp',
    'discordbot',
    'applebot',
    'crawler',
    'spider',
    'bot/',
  ];

  return botPatterns.some((pattern) => ua.includes(pattern));
}

/**
 * User-Agent 기반 디바이스 타입 파싱
 * @param userAgent User-Agent 문자열
 * @returns 디바이스 타입
 */
export function parseDeviceType(
  userAgent: string | null
): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // 모바일 감지
  if (
    /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(
      ua
    )
  ) {
    return 'mobile';
  }

  // 태블릿 감지
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }

  // 데스크톱 감지
  if (
    /desktop|windows|macintosh|linux|x11|ubuntu|fedora|debian/i.test(ua)
  ) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Referrer URL에서 호스트명 추출 (www 제거)
 * @param referrer Referrer URL
 * @returns 호스트명 또는 null
 */
export function parseReferrerHost(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    let hostname = url.hostname;

    // www 제거
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * URL에서 UTM 파라미터 추출
 * @param url URL 문자열 또는 URLSearchParams
 * @returns UTM 객체
 */
export function parseUTM(
  url: string | URLSearchParams
): {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
} {
  let params: URLSearchParams;

  if (typeof url === 'string') {
    try {
      const urlObj = new URL(url);
      params = urlObj.searchParams;
    } catch {
      // URL 파싱 실패 시 빈 params
      params = new URLSearchParams();
    }
  } else {
    params = url;
  }

  return {
    source: params.get('utm_source') || null,
    medium: params.get('utm_medium') || null,
    campaign: params.get('utm_campaign') || null,
    term: params.get('utm_term') || null,
    content: params.get('utm_content') || null,
  };
}

/**
 * 페이지 경로에서 locale 추출
 * @param pathname 페이지 경로 (예: /ko/blog/post)
 * @returns locale 또는 null
 */
export function parseLocaleFromPath(pathname: string): 'ko' | 'en' | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'ko') return 'ko';
  if (segments[0] === 'en') return 'en';
  return null;
}

/**
 * 페이지 경로에서 post_id 추출 (slug 기반)
 * @param pathname 페이지 경로 (예: /ko/blog/ai-agent)
 * @returns slug 또는 null
 */
export function parseSlugFromPath(pathname: string): string | null {
  // /ko/blog/[slug] 또는 /en/blog/[slug] 패턴
  const match = pathname.match(/^\/(?:ko|en)\/blog\/([^/]+)/);
  return match ? match[1] : null;
}

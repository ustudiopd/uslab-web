/**
 * 보고서용 날짜 포맷팅 유틸리티
 * 한국 시간(Asia/Seoul) 기준으로 날짜를 포맷팅
 */

/**
 * 날짜를 한국 시간 기준으로 포맷팅
 * @param date 날짜 객체 (UTC 또는 로컬 시간)
 * @param options 포맷 옵션
 * @returns 포맷된 날짜 문자열
 */
export function formatDateKST(
  date: Date,
  options: {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
  } = {}
): string {
  const defaultOptions = {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    ...options,
  };

  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...defaultOptions,
  });

  return fmt.format(date);
}

/**
 * 날짜 범위를 한국 시간 기준으로 포맷팅 (보고서용)
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @param days 일수
 * @returns 포맷된 날짜 범위 문자열
 */
export function formatDateRangeForReport(
  startDate: Date,
  endDate: Date,
  days: number
): string {
  const startStr = formatDateKST(startDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const endStr = formatDateKST(endDate, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return `${startStr} ~ ${endStr} (${days}일)`;
}

/**
 * 날짜를 한국 시간 기준으로 간단히 포맷팅 (예: 2025년 12월 25일)
 * @param date 날짜 객체
 * @returns 포맷된 날짜 문자열
 */
export function formatDateKSTSimple(date: Date): string {
  return formatDateKST(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 날짜를 한국 시간 기준으로 짧게 포맷팅 (예: 12/25)
 * @param date 날짜 객체
 * @returns 포맷된 날짜 문자열
 */
export function formatDateKSTShort(date: Date): string {
  return formatDateKST(date, {
    month: 'numeric',
    day: 'numeric',
  });
}


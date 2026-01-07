/**
 * Analytics 설정
 * 환경변수를 통한 prefix 및 설정 관리
 */

/**
 * Analytics prefix (기본값: uslab)
 * 환경변수 ANALYTICS_PREFIX가 없으면 'uslab' 사용
 */
export const ANALYTICS_PREFIX =
  (process.env.ANALYTICS_PREFIX || 'uslab').toLowerCase();

/**
 * Analytics 활성화 여부 (기본값: true)
 */
export const ANALYTICS_ENABLED =
  process.env.ANALYTICS_ENABLED !== 'false';

/**
 * 이벤트 샘플링 비율 (기본값: 1.0 = 100%)
 */
export const ANALYTICS_SAMPLE_RATE_EVENTS = parseFloat(
  process.env.ANALYTICS_SAMPLE_RATE_EVENTS || '1.0'
);

/**
 * 히트맵 샘플링 비율 (기본값: 1.0 = 100%)
 */
export const ANALYTICS_SAMPLE_RATE_HEATMAP = parseFloat(
  process.env.ANALYTICS_SAMPLE_RATE_HEATMAP || '1.0'
);

/**
 * 제외할 경로 prefix 목록
 */
export const ANALYTICS_EXCLUDE_PATH_PREFIXES = (
  process.env.ANALYTICS_EXCLUDE_PATH_PREFIXES ||
  '/admin,/api,/_next'
).split(',').map((p) => p.trim());

/**
 * Do Not Track 존중 여부 (기본값: true)
 */
export const ANALYTICS_RESPECT_DNT =
  process.env.ANALYTICS_RESPECT_DNT !== 'false';

/**
 * 테이블 이름 생성 헬퍼
 * @param tableName 테이블 이름 (prefix 없이)
 * @returns prefix가 붙은 테이블 이름
 */
export function getAnalyticsTableName(tableName: string): string {
  return `${ANALYTICS_PREFIX}_${tableName}`;
}

/**
 * localStorage 세션 키 이름 생성
 * @returns 세션 키 이름
 */
export function getSessionStorageKey(): string {
  return `${ANALYTICS_PREFIX}_sid`;
}

/**
 * localStorage 마지막 활동 시간 키 이름 생성
 * @returns 마지막 활동 시간 키 이름
 */
export function getLastSeenStorageKey(): string {
  return `${ANALYTICS_PREFIX}_sid_last`;
}







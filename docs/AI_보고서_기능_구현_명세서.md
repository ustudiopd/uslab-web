# AI 보고서 기능 구현 명세서

**작성일**: 2025-01-XX  
**프로젝트**: USLab.ai  
**목적**: AI 기반 대시보드 분석 보고서 자동 생성 기능 구현  
**버전**: 1.0

---

## 📋 목차

1. [개요](#개요)
2. [현재 수집되는 트래킹 데이터](#현재-수집되는-트래킹-데이터)
3. [대시보드 구성 요소](#대시보드-구성-요소)
4. [AI 보고서 데이터 구조](#ai-보고서-데이터-구조)
5. [AI 보고서 생성 방안](#ai-보고서-생성-방안)
6. [구현 계획](#구현-계획)

---

## 1. 개요

### 1.1 목적

대시보드에 표시되는 모든 통계 데이터를 AI가 분석하여 인사이트와 권장사항을 포함한 자동 보고서를 생성합니다.

### 1.2 주요 기능

- **자동 분석**: 대시보드 데이터를 AI가 분석하여 트렌드, 패턴, 이상 징후 감지
- **인사이트 제공**: 주요 발견사항, 개선 기회, 성과 요약
- **권장사항 제시**: 구체적인 액션 아이템 제안
- **기간별 리포트**: 일일/주간/월간 리포트 생성

---

## 2. 현재 수집되는 트래킹 데이터

### 2.1 세션 데이터 (`uslab_sessions`)

**수집 항목**:
- `session_key`: 세션 식별자 (UUID, localStorage 기반)
- `landing_path`: 첫 유입 경로
- `referrer`: 이전 페이지 URL
- `referrer_host`: Referrer 호스트명 (www 제거)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`: UTM 파라미터
- `user_agent`: User-Agent 문자열
- `device_type`: 디바이스 타입 (mobile/tablet/desktop/bot/unknown)
- `created_at`: 세션 생성 시간
- `last_seen_at`: 마지막 활동 시간

**AI 보고서 활용**:
- 유입 경로 분석 (UTM 캠페인 효과)
- 디바이스별 트래픽 분포
- 세션 지속 시간 분석

---

### 2.2 페이지뷰 데이터 (`uslab_page_views`)

**수집 항목**:
- `id`: 페이지뷰 ID (클라이언트 생성 UUID)
- `session_id`: 세션 ID (FK)
- `post_id`: 포스트 ID (자동 매핑, nullable)
- `about_id`: About 페이지 ID (자동 매핑, nullable)
- `page_path`: 페이지 경로 (정규화된 pathname)
- `locale`: 언어 (ko/en)
- `view_duration`: 페이지 체류 시간 (초, nullable)
- `scroll_depth`: 스크롤 깊이 (0-100%, nullable)
- `created_at`: 페이지뷰 생성 시간

**AI 보고서 활용**:
- 페이지별 인기도 분석
- 콘텐츠 성과 분석 (포스트별 조회수)
- 언어별 트래픽 분포
- 페이지 체류 시간 분석

---

### 2.3 이벤트 데이터 (`uslab_events`)

**수집 항목**:
- `id`: 이벤트 ID (클라이언트 생성 UUID)
- `session_id`: 세션 ID (FK)
- `page_view_id`: 페이지뷰 ID (FK, nullable)
- `name`: 이벤트 이름 (click, scroll_depth, conversion, page_engagement, web_vital)
- `page_path`: 이벤트 발생 페이지 경로
- `props`: 이벤트 속성 (JSONB)
- `client_ts`: 클라이언트 타임스탬프 (밀리초, nullable)
- `created_at`: 이벤트 생성 시간

**이벤트 타입별 props 구조**:

#### A) Click 이벤트
```json
{
  "x": 0.41,              // 클릭 X 좌표 (0~1 정규화)
  "y": 0.78,              // 클릭 Y 좌표 (0~1 정규화)
  "viewport_w": 1920,     // 뷰포트 너비
  "viewport_h": 1080,     // 뷰포트 높이
  "element_id": "cta-button",  // 요소 ID (data-analytics-id)
  "element_tag": "button",     // 요소 태그
  "href_host": "example.com"   // 링크 호스트 (있는 경우)
}
```

#### B) Scroll Depth 이벤트
```json
{
  "max_scroll_pct": 0.85  // 최대 스크롤 깊이 (0~1)
}
```

#### C) Conversion 이벤트
```json
{
  "key": "inquiry_submit",  // 전환 키
  "value": 1,               // 전환 값 (선택적)
  "meta": {}                // 추가 메타데이터
}
```

#### D) Page Engagement 이벤트
```json
{
  "view_duration_sec": 120,  // 페이지 체류 시간 (초)
  "scroll_depth_pct": 0.85   // 스크롤 깊이 (0~1)
}
```

#### E) Web Vitals 이벤트
```json
{
  "name": "LCP",                    // 메트릭 이름 (LCP, CLS, INP, FCP, TTFB)
  "value": 2500,                    // 메트릭 값 (밀리초 또는 점수)
  "rating": "good",                 // Rating (good/needs-improvement/poor)
  "id": "metric-id",                // 고유 ID
  "delta": 100,                     // 이전 값과의 차이
  "navigationType": "navigate"      // 네비게이션 타입
}
```

**AI 보고서 활용**:
- 사용자 행동 패턴 분석 (클릭 히트맵)
- 콘텐츠 참여도 분석 (스크롤 깊이, 체류 시간)
- 전환율 분석
- 성능 모니터링 (Web Vitals)

---

## 3. 대시보드 구성 요소

### 3.1 API 응답 구조 (`/api/admin/dashboard`)

**엔드포인트**: `GET /api/admin/dashboard`

**쿼리 파라미터**:
- `startDate`: 시작 날짜 (YYYY-MM-DD, 선택)
- `endDate`: 종료 날짜 (YYYY-MM-DD, 선택)
- `days`: 기간 일수 (기본값: 30, 선택)

**응답 구조**:

```typescript
{
  // 1. 기본 통계
  stats: {
    totalPosts: number;              // 총 포스트 수
    publishedPosts: number;           // 발행 포스트 수
    draftPosts: number;               // 초안 포스트 수
    totalViews: number;               // 총 조회수 (view_count 합계)
    todayPageviews: number;           // 오늘 페이지뷰
    todayUniques: number;            // 오늘 고유 방문자
    last7Days: {
      pageviews: number;              // 최근 7일 페이지뷰
      uniques: number;                // 최근 7일 고유 방문자
    };
    last30Days: {
      pageviews: number;              // 최근 30일 페이지뷰
      uniques: number;                // 최근 30일 고유 방문자
    };
  };

  // 2. Top 데이터
  topPages: Array<{
    page_path: string;
    pageviews: number;
    uniques: number;
  }>;

  topPosts: Array<{
    post_id: string;
    title: string;
    locale: string;
    pageviews: number;
    uniques: number;
  }>;

  topReferrers: Array<{
    referrer_host: string | null;     // null이면 (direct)
    sessions: number;
  }>;

  // 3. 최근 활동
  recentActivity: {
    posts: Array<{
      id: string;
      title: string;
      published_at: string | null;
    }>;
    comments: Array<{
      id: string;
      author_name: string;
      created_at: string;
    }>;
    inquiries: Array<{
      id: string;
      name: string;
      status: string;                 // pending/contacted/completed
      created_at: string;
    }>;
  };

  // 4. 일별 통계 (차트용)
  dailyStats: {
    last7Days: Array<{
      day: string;                    // YYYY-MM-DD
      pageviews: number;
      uniques: number;
    }>;
    last30Days: Array<{
      day: string;
      pageviews: number;
      uniques: number;
    }>;
  };

  // 5. SEO 상태
  seoStatus: {
    technical: {
      hasSitemap: boolean;
      hasRobots: boolean;
      hasCanonical: boolean;
      hasJsonLd: boolean;
    };
    quality: {
      totalPublished: number;
      missingSeoTitle: number;
      missingSeoDescription: number;
      seoTitleTooLong: number;
      seoDescriptionTooLong: number;
      postsWithIssues?: Array<{
        id: string;
        title: string;
        slug: string;
        locale: string;
        issues: string[];             // missing_title, missing_description, title_too_long, description_too_long
      }>;
    };
  };

  // 6. 운영진 보드 하이라이트
  topExecDoc: {
    id: string;
    title: string;
    updated_at: string;
    board_id: string;
  } | null;

  // 7. 히트맵 데이터
  heatmapData: {
    topClickedElements: Array<{
      element_id: string | null;
      page_path: string;
      clicks: number;
    }>;
    pageClickStats: Array<{
      page_path: string;
      clicks: number;
      unique_elements: number;
    }>;
  } | null;

  // 8. Web Vitals 데이터
  webVitalsData: {
    metrics: Array<{
      name: string;                   // LCP, CLS, INP, FCP, TTFB
      p50: number;                    // 50th 백분위수
      p75: number;                    // 75th 백분위수
      p95: number;                    // 95th 백분위수
      count: number;                  // 총 측정 수
      good: number;                   // Good rating 수
      needsImprovement: number;       // Needs Improvement rating 수
      poor: number;                   // Poor rating 수
    }>;
  } | null;

  // 9. 날짜 범위 정보
  dateRange: {
    startDate: string | null;         // ISO 8601 형식
    endDate: string | null;           // ISO 8601 형식
    days: number;                     // 계산된 일수
  };
}
```

---

### 3.2 대시보드 UI 구성 요소

#### A) 운영진 보드 하이라이트
- 첫 번째 운영진 보드의 최상단 문서 표시
- 클릭 시 해당 문서 편집 페이지로 이동

#### B) KPI 카드 (4개)
1. **총 포스트**: 총 포스트 수, 발행/초안 구분
2. **오늘 방문자**: 오늘 고유 방문자 수, 페이지뷰 수
3. **최근 7일**: 7일간 고유 방문자 수, 페이지뷰 수
4. **최근 30일**: 30일간 고유 방문자 수, 페이지뷰 수

#### C) 트래픽 추이 차트
- **라이브러리**: Recharts (`LineChart`)
- **기간 선택**: 7일 / 30일 토글
- **데이터**: 일별 페이지뷰 및 방문자 수
- **시각화**: 페이지뷰 (Cyan), 방문자 (Indigo)

#### D) SEO 상태 박스 (2개)
1. **기술적 SEO**: Sitemap, Robots.txt, Canonical URL, JSON-LD 존재 여부
2. **포스트 SEO 품질**: 발행 포스트 수, SEO 제목/설명 누락 수, 길이 초과 수

#### E) SEO 문제 포스트 목록
- SEO 문제가 있는 포스트 목록
- 문제 유형별 배지 표시
- 클릭 시 포스트 편집 페이지로 이동

#### F) 히트맵 데이터 (2개 카드)
1. **인기 클릭 요소 (30일)**: Top 10 클릭된 요소
2. **페이지별 클릭 (30일)**: Top 10 페이지별 클릭 통계

#### G) Web Vitals 카드
- 메트릭별 상세 정보 (LCP, CLS, INP, FCP, TTFB)
- P50/P75/P95 값 표시
- Rating별 분포 (Good/Needs Improvement/Poor)

#### H) Top 콘텐츠 및 Referrer
1. **인기 포스트 (30일)**: Top 10 포스트
2. **유입 경로 (30일)**: Top 10 Referrer

#### I) 최근 활동 (3개 카드)
1. **최근 발행 포스트**: 최근 5개
2. **최근 댓글**: 최근 5개 승인된 댓글
3. **최근 문의**: 최근 5개 문의

---

## 4. AI 보고서 데이터 구조

### 4.1 AI 보고서 입력 데이터

AI 보고서 생성 시 다음 데이터를 AI에 전달합니다:

```typescript
interface AIReportInput {
  // 메타 정보
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    startDate: string;  // ISO 8601
    endDate: string;    // ISO 8601
    days: number;
  };

  // 기본 통계
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    todayPageviews: number;
    todayUniques: number;
    last7Days: { pageviews: number; uniques: number };
    last30Days: { pageviews: number; uniques: number };
  };

  // 트래픽 추이
  dailyStats: Array<{
    day: string;
    pageviews: number;
    uniques: number;
  }>;

  // Top 데이터
  topPages: Array<{
    page_path: string;
    pageviews: number;
    uniques: number;
  }>;
  topPosts: Array<{
    post_id: string;
    title: string;
    locale: string;
    pageviews: number;
    uniques: number;
  }>;
  topReferrers: Array<{
    referrer_host: string | null;
    sessions: number;
  }>;

  // SEO 상태
  seoStatus: {
    technical: {
      hasSitemap: boolean;
      hasRobots: boolean;
      hasCanonical: boolean;
      hasJsonLd: boolean;
    };
    quality: {
      totalPublished: number;
      missingSeoTitle: number;
      missingSeoDescription: number;
      seoTitleTooLong: number;
      seoDescriptionTooLong: number;
      postsWithIssues: Array<{
        id: string;
        title: string;
        slug: string;
        locale: string;
        issues: string[];
      }>;
    };
  };

  // 히트맵 데이터
  heatmapData: {
    topClickedElements: Array<{
      element_id: string | null;
      page_path: string;
      clicks: number;
    }>;
    pageClickStats: Array<{
      page_path: string;
      clicks: number;
      unique_elements: number;
    }>;
  } | null;

  // Web Vitals 데이터
  webVitalsData: {
    metrics: Array<{
      name: string;
      p50: number;
      p75: number;
      p95: number;
      count: number;
      good: number;
      needsImprovement: number;
      poor: number;
    }>;
  } | null;

  // 최근 활동
  recentActivity: {
    posts: Array<{ id: string; title: string; published_at: string | null }>;
    comments: Array<{ id: string; author_name: string; created_at: string }>;
    inquiries: Array<{ id: string; name: string; status: string; created_at: string }>;
  };
}
```

---

### 4.2 AI 보고서 출력 구조

AI가 생성하는 보고서 구조:

```typescript
interface AIReport {
  // 메타 정보
  reportId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  generatedAt: string;  // ISO 8601

  // 요약
  summary: {
    overview: string;              // 전체 요약 (2-3문장)
    keyMetrics: {
      totalPageviews: number;
      totalUniques: number;
      avgDailyPageviews: number;
      avgDailyUniques: number;
      topPostTitle: string;
      topPostPageviews: number;
    };
  };

  // 주요 발견사항
  insights: Array<{
    type: 'positive' | 'warning' | 'negative' | 'info';
    title: string;
    description: string;
    data: any;                      // 관련 데이터 (선택적)
    priority: 'high' | 'medium' | 'low';
  }>;

  // 트렌드 분석
  trends: {
    trafficTrend: 'increasing' | 'decreasing' | 'stable';
    trafficTrendDescription: string;
    topContentTrend: string;        // 인기 콘텐츠 트렌드 설명
    referrerTrend: string;          // 유입 경로 트렌드 설명
  };

  // 성능 분석
  performance: {
    webVitals: {
      overall: 'good' | 'needs-improvement' | 'poor';
      summary: string;
      metrics: Array<{
        name: string;
        status: 'good' | 'needs-improvement' | 'poor';
        value: number;
        recommendation: string;
      }>;
    };
    engagement: {
      avgScrollDepth: number;
      avgViewDuration: number;
      topEngagedPages: Array<{
        page_path: string;
        avgScrollDepth: number;
        avgViewDuration: number;
      }>;
    };
  };

  // SEO 분석
  seo: {
    technicalStatus: 'good' | 'needs-improvement';
    technicalIssues: string[];
    contentQuality: {
      score: number;                // 0-100
      issues: Array<{
        type: string;
        count: number;
        description: string;
      }>;
      recommendations: string[];
    };
  };

  // 권장사항
  recommendations: Array<{
    category: 'content' | 'seo' | 'performance' | 'ux' | 'marketing';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }>;

  // 비교 분석 (이전 기간 대비)
  comparison?: {
    previousPeriod: {
      startDate: string;
      endDate: string;
    };
    changes: {
      pageviews: {
        current: number;
        previous: number;
        change: number;             // 퍼센트 변화
        trend: 'up' | 'down' | 'stable';
      };
      uniques: {
        current: number;
        previous: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
  };
}
```

---

## 5. AI 보고서 생성 방안

### 5.1 API 엔드포인트

**엔드포인트**: `POST /api/ai/analytics-report`

**요청 본문**:
```typescript
{
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;  // custom일 때 필수
  endDate?: string;    // custom일 때 필수
  days?: number;       // daily/weekly/monthly일 때 사용
  includeComparison?: boolean;  // 이전 기간 비교 포함 여부
}
```

**응답**:
```typescript
{
  report: AIReport;
  generatedAt: string;
}
```

---

### 5.2 AI 프롬프트 구조

#### A) 시스템 프롬프트

```
당신은 웹사이트 분석 전문가입니다. 제공된 대시보드 데이터를 분석하여 
인사이트와 권장사항을 포함한 종합 보고서를 작성합니다.

보고서 작성 원칙:
1. 데이터 기반 객관적 분석
2. 구체적이고 실행 가능한 권장사항
3. 우선순위가 명확한 인사이트
4. 한국어로 작성 (전문 용어는 영문 병기 가능)
5. 긍정적 발견사항과 개선 기회를 균형있게 제시
```

#### B) 사용자 프롬프트 (데이터 포함)

```
다음은 USLab.ai 웹사이트의 대시보드 데이터입니다:

[기간 정보]
- 보고서 유형: {reportType}
- 기간: {startDate} ~ {endDate} ({days}일)

[기본 통계]
- 총 포스트: {totalPosts}개 (발행: {publishedPosts}, 초안: {draftPosts})
- 총 조회수: {totalViews}
- 오늘 방문자: {todayUniques}명, 페이지뷰: {todayPageviews}회
- 최근 7일: 방문자 {last7Days.uniques}명, 페이지뷰 {last7Days.pageviews}회
- 최근 30일: 방문자 {last30Days.uniques}명, 페이지뷰 {last30Days.pageviews}회

[트래픽 추이]
{dailyStats를 일별로 나열}

[Top 콘텐츠]
- Top Pages: {topPages 상위 5개 나열}
- Top Posts: {topPosts 상위 5개 나열}
- Top Referrers: {topReferrers 상위 5개 나열}

[SEO 상태]
- 기술적 SEO: {technical SEO 상태}
- 포스트 SEO 품질: {quality 통계 및 문제 포스트}

[히트맵 데이터]
- 인기 클릭 요소: {topClickedElements 상위 5개}
- 페이지별 클릭: {pageClickStats 상위 5개}

[Web Vitals]
{webVitalsData 메트릭별 상세 정보}

[최근 활동]
- 최근 발행 포스트: {recentActivity.posts}
- 최근 댓글: {recentActivity.comments}
- 최근 문의: {recentActivity.inquiries}

위 데이터를 분석하여 다음 구조로 보고서를 작성해주세요:
1. 요약 (전체 개요 및 주요 지표)
2. 주요 발견사항 (긍정/경고/부정/정보)
3. 트렌드 분석 (트래픽, 콘텐츠, 유입 경로)
4. 성능 분석 (Web Vitals, 참여도)
5. SEO 분석 (기술적 SEO, 콘텐츠 품질)
6. 권장사항 (카테고리별, 우선순위별)
```

---

### 5.3 구현 파일 구조

```
app/
├── api/
│   └── ai/
│       └── analytics-report/
│           └── route.ts              # AI 보고서 생성 API
app/
└── admin/
    └── dashboard/
        └── page.tsx                  # 대시보드 UI (보고서 버튼 추가)
components/
└── admin/
    └── AnalyticsReport.tsx          # 보고서 뷰어 컴포넌트
lib/
└── utils/
    └── reportFormatter.ts           # 보고서 데이터 포맷팅 유틸리티
```

---

## 6. 구현 계획

### 6.1 Phase 1: 기본 AI 보고서 생성

**작업 목록**:
1. ✅ `/api/ai/analytics-report` API 엔드포인트 생성
   - 대시보드 데이터 조회
   - AI 프롬프트 구성
   - Gemini API 호출
   - 보고서 JSON 반환

2. ✅ 보고서 데이터 포맷팅 유틸리티
   - 대시보드 데이터를 AI 프롬프트 형식으로 변환
   - 날짜 범위 처리
   - 이전 기간 비교 데이터 조회 (선택적)

3. ✅ 대시보드 UI에 보고서 생성 버튼 추가
   - "AI 보고서 생성" 버튼
   - 로딩 상태 표시
   - 보고서 뷰어 모달

**예상 기간**: 2-3일  
**리스크**: 낮음  
**ROI**: 높음

---

### 6.2 Phase 2: 보고서 뷰어 및 저장

**작업 목록**:
1. ✅ 보고서 뷰어 컴포넌트 (`AnalyticsReport.tsx`)
   - 섹션별 표시 (요약, 인사이트, 트렌드, 권장사항)
   - 카드 형태로 시각화
   - 인사이트 타입별 색상 구분

2. ✅ 보고서 저장 기능
   - `uslab_analytics_reports` 테이블 생성
   - 보고서 저장 API
   - 저장된 보고서 목록 조회

3. ✅ 보고서 내보내기
   - PDF 내보내기 (선택적)
   - Markdown 내보내기

**예상 기간**: 2-3일  
**리스크**: 낮음  
**ROI**: 중간

---

### 6.3 Phase 3: 자동 리포트 생성 (스케줄러)

**작업 목록**:
1. ✅ 일일/주간/월간 자동 리포트 생성
   - Vercel Cron 설정
   - `/api/ai/analytics-report` 호출
   - 보고서 자동 저장

2. ✅ 이메일 알림 (선택적)
   - 관리자에게 리포트 이메일 발송
   - 주요 인사이트 요약 포함

**예상 기간**: 1-2일  
**리스크**: 낮음  
**ROI**: 중간

---

## 7. 데이터 활용 예시

### 7.1 트래픽 분석

**AI가 분석할 수 있는 인사이트**:
- "최근 7일간 트래픽이 전주 대비 15% 증가했습니다. 주요 원인은 'AI Agent' 포스트의 인기 상승으로 보입니다."
- "주말 트래픽이 평일 대비 30% 감소하는 패턴이 관찰됩니다. 주말 콘텐츠 전략을 검토해보세요."

### 7.2 콘텐츠 성과 분석

**AI가 분석할 수 있는 인사이트**:
- "Top 3 포스트가 전체 트래픽의 45%를 차지합니다. 유사한 주제의 콘텐츠를 추가로 제작하는 것을 권장합니다."
- "'AI Agent' 포스트의 평균 체류 시간이 3분 20초로 다른 포스트 대비 2배 높습니다. 이 포스트의 구조를 참고하여 다른 콘텐츠를 개선할 수 있습니다."

### 7.3 SEO 분석

**AI가 분석할 수 있는 인사이트**:
- "발행된 포스트 중 12개(15%)가 SEO 제목이 누락되어 있습니다. 검색 노출 기회를 놓치고 있습니다."
- "SEO 설명이 160자를 초과하는 포스트가 5개 있습니다. 검색 결과에서 잘릴 수 있습니다."

### 7.4 성능 분석

**AI가 분석할 수 있는 인사이트**:
- "LCP 평균값이 2.5초로 'Good' 기준(2.5초)에 근접합니다. 이미지 최적화를 통해 개선 여지가 있습니다."
- "CLS 점수가 0.1로 'Needs Improvement' 상태입니다. 레이아웃 시프트를 유발하는 요소를 확인해보세요."

### 7.5 사용자 행동 분석

**AI가 분석할 수 있는 인사이트**:
- "메인 페이지의 '문의하기' 버튼 클릭률이 높습니다. CTA 위치가 효과적입니다."
- "블로그 포스트의 평균 스크롤 깊이가 60%입니다. 콘텐츠 중간에 시각적 요소를 추가하면 참여도를 높일 수 있습니다."

---

## 8. AI 모델 선택

### 8.1 권장 모델

- **Gemini 2.0 Flash**: 현재 프로젝트에서 사용 중, 빠른 응답 속도
- **Gemini 2.0 Pro**: 더 정확한 분석이 필요한 경우

### 8.2 프롬프트 최적화

- **구조화된 데이터 제공**: JSON 형식으로 명확하게 구조화
- **컨텍스트 제공**: 각 지표의 의미와 기준값 설명
- **출력 형식 지정**: JSON Schema로 출력 형식 명시

---

## 9. 보안 및 비용 고려사항

### 9.1 보안

- 관리자 인증 필수
- Rate Limiting 적용 (과도한 요청 방지)
- 민감한 데이터 필터링 (개인정보 제외)

### 9.2 비용 최적화

- 보고서 생성 빈도 제한 (일일 1회 권장)
- 프롬프트 길이 최적화 (필수 데이터만 포함)
- 캐싱 전략 (같은 기간 리포트 재사용)

---

## 10. 결론

현재 수집되는 모든 트래킹 데이터와 대시보드 구성 요소를 정리하여 AI 보고서 기능 구현의 기반을 마련했습니다.

**다음 단계**:
1. `/api/ai/analytics-report` API 구현
2. 보고서 뷰어 컴포넌트 구현
3. 대시보드 UI에 보고서 생성 버튼 추가

**예상 완료 기간**: 3-5일

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX





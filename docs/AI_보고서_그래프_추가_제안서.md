# AI 보고서 그래프 추가 제안서

**작성 일자**: 2025-01-16  
**목적**: AI 보고서의 시각적 표현 개선을 위한 그래프 추가 제안

---

## 📋 현재 상태

### 문제점
- AI 보고서가 텍스트 중심으로만 구성되어 있어 단조로움
- 숫자 데이터가 많지만 시각적 표현이 부족
- 트렌드나 변화를 한눈에 파악하기 어려움

### 현재 보고서 구조
- 요약 (텍스트 + 숫자 카드)
- 주요 발견사항 (텍스트 카드)
- 권장사항 (텍스트 카드)

---

## 📊 그래프로 표현 가능한 요소

### 1. 일별 트래픽 추이 (Line Chart) ⭐ **최우선**

**데이터 소스**: `getDailyStatsByRange()` 함수로 일별 페이지뷰/방문자 데이터 조회

**표시 위치**: 요약 섹션 하단

**차트 타입**: Line Chart (2개 라인)
- 페이지뷰 (파란색)
- 방문자 (보라색)

**데이터 구조**:
```typescript
[
  { day: "2025-01-01", pageviews: 100, uniques: 50 },
  { day: "2025-01-02", pageviews: 120, uniques: 60 },
  // ...
]
```

**구현 방법**:
- 보고서 모달에서 `report.period.startDate`, `report.period.endDate` 사용
- `/api/admin/dashboard?startDate=...&endDate=...` 호출하여 `dailyStats` 가져오기
- Recharts `LineChart` 컴포넌트로 표시

---

### 2. 이전 기간 비교 (Bar Chart) ⭐ **높은 우선순위**

**데이터 소스**: `report.comparison` 객체

**표시 위치**: 요약 섹션 또는 별도 비교 섹션

**차트 타입**: Bar Chart (2개 그룹)
- 현재 기간 vs 이전 기간
- 페이지뷰, 방문자 비교

**데이터 구조**:
```typescript
{
  changes: {
    pageviews: {
      current: 15000,
      previous: 12000,
      change: 3000,
      trend: "up"
    },
    uniques: {
      current: 5000,
      previous: 4500,
      change: 500,
      trend: "up"
    }
  }
}
```

**구현 방법**:
- `report.comparison`이 있을 때만 표시
- Recharts `BarChart` 컴포넌트 사용
- 증감률 퍼센트 표시

---

### 3. Web Vitals 성능 지표 (Radar Chart 또는 Bar Chart)

**데이터 소스**: `report.performance.webVitals.metrics`

**표시 위치**: 성능 섹션

**차트 타입**: 
- **옵션 A**: Radar Chart (6개 메트릭을 한눈에)
- **옵션 B**: Bar Chart (각 메트릭별 상태 색상)

**데이터 구조**:
```typescript
{
  metrics: [
    { name: "LCP", status: "good", value: 1200 },
    { name: "CLS", status: "good", value: 0.05 },
    { name: "INP", status: "needs-improvement", value: 250 },
    // ...
  ]
}
```

**구현 방법**:
- Recharts `RadarChart` 또는 `BarChart` 사용
- 상태별 색상: good(초록), needs-improvement(노랑), poor(빨강)

---

### 4. Top 페이지/포스트 순위 (Bar Chart)

**데이터 소스**: 보고서 생성 시 사용된 `topPages`, `topPosts` 데이터 (별도 조회 필요)

**표시 위치**: 트렌드 섹션 또는 별도 섹션

**차트 타입**: Horizontal Bar Chart
- 상위 5-10개만 표시
- 페이지뷰 수로 정렬

**데이터 구조**:
```typescript
[
  { page_path: "/blog/post-1", pageviews: 500 },
  { page_path: "/blog/post-2", pageviews: 400 },
  // ...
]
```

**구현 방법**:
- 보고서 모달에서 `report.period` 정보로 `/api/admin/dashboard` 호출
- `topPages`, `topPosts` 데이터 가져오기
- Recharts `BarChart` (layout="horizontal") 사용

---

### 5. 인사이트 증감률 (Bar Chart)

**데이터 소스**: `report.insights[].evidence.changePct`

**표시 위치**: 주요 발견사항 섹션

**차트 타입**: Bar Chart (증감률 표시)
- 양수: 초록색 (증가)
- 음수: 빨간색 (감소)

**데이터 구조**:
```typescript
insights
  .filter(i => i.evidence?.changePct !== undefined)
  .map(i => ({
    title: i.title,
    changePct: i.evidence.changePct
  }))
```

**구현 방법**:
- 인사이트 카드 옆에 작은 막대 그래프 추가
- 또는 별도 "변화율 요약" 섹션 생성

---

### 6. 트렌드 방향 (Pie Chart 또는 Donut Chart)

**데이터 소스**: `report.trends.trafficTrend`

**표시 위치**: 트렌드 섹션

**차트 타입**: Pie Chart 또는 Donut Chart
- 증가 / 감소 / 안정 비율

**데이터 구조**:
```typescript
{
  trafficTrend: "increasing" | "decreasing" | "stable"
}
```

**구현 방법**:
- 트렌드 텍스트 옆에 시각적 표현 추가
- 단순하지만 직관적

---

## 🎯 우선순위별 구현 계획

### Phase 1: 핵심 그래프 (즉시 구현 권장)

#### 1. 일별 트래픽 추이 Line Chart
- **우선순위**: 최우선
- **난이도**: 낮음 (기존 코드 재사용 가능)
- **영향**: 가장 큰 시각적 개선 효과

**구현 위치**: `app/admin/dashboard/page.tsx` - 보고서 모달 내부

**코드 예시**:
```typescript
// 보고서 모달에서
const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

useEffect(() => {
  if (report?.period) {
    fetchDailyStats(report.period.startDate, report.period.endDate);
  }
}, [report]);

const fetchDailyStats = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/admin/dashboard?startDate=${startDate}&endDate=${endDate}`
  );
  const data = await response.json();
  setDailyStats(data.dailyStats || []);
};

// 그래프 렌더링
{dailyStats.length > 0 && (
  <div className="mt-6">
    <h4 className="text-md font-bold text-slate-900 mb-3">일별 트래픽 추이</h4>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dailyStats}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tickFormatter={(v) => formatDate(v)} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pageviews" stroke="#06b6d4" name="페이지뷰" />
        <Line type="monotone" dataKey="uniques" stroke="#8b5cf6" name="방문자" />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}
```

---

#### 2. 이전 기간 비교 Bar Chart
- **우선순위**: 높음
- **난이도**: 낮음
- **영향**: 비교 분석 시각화

**구현 위치**: 요약 섹션 또는 별도 비교 섹션

**코드 예시**:
```typescript
{report.comparison && (
  <div className="mt-6">
    <h4 className="text-md font-bold text-slate-900 mb-3">이전 기간 대비</h4>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={[
        {
          name: '페이지뷰',
          현재: report.comparison.changes.pageviews.current,
          이전: report.comparison.changes.pageviews.previous,
        },
        {
          name: '방문자',
          현재: report.comparison.changes.uniques.current,
          이전: report.comparison.changes.uniques.previous,
        },
      ]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="현재" fill="#06b6d4" />
        <Bar dataKey="이전" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  </div>
)}
```

---

### Phase 2: 추가 그래프 (선택적)

#### 3. Web Vitals Radar Chart
- **우선순위**: 중간
- **난이도**: 중간
- **영향**: 성능 지표 시각화

#### 4. Top 페이지/포스트 Bar Chart
- **우선순위**: 중간
- **난이도**: 낮음
- **영향**: 인기 콘텐츠 시각화

---

## 🎨 디자인 제안

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│ AI 분석 보고서                      │
├─────────────────────────────────────┤
│ 요약                                │
│ [텍스트 설명]                        │
│ [숫자 카드 3개]                      │
│ ┌─────────────────────────────────┐ │
│ │ 일별 트래픽 추이 (Line Chart)    │ │ ← 새로 추가
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 이전 기간 대비 (Bar Chart)      │ │ ← 새로 추가
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 주요 발견사항                        │
│ [인사이트 카드들]                    │
│ ┌─────────────────────────────────┐ │
│ │ 변화율 요약 (Bar Chart)          │ │ ← 선택적 추가
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 성능 분석                            │
│ ┌─────────────────────────────────┐ │
│ │ Web Vitals (Radar Chart)        │ │ ← 선택적 추가
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 트렌드 분석                          │
│ ┌─────────────────────────────────┐ │
│ │ Top 페이지 (Bar Chart)          │ │ ← 선택적 추가
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 권장사항                            │
│ [권장사항 카드들]                    │
└─────────────────────────────────────┘
```

---

## 🔧 구현 상세

### 1. 일별 트래픽 추이 그래프

**파일**: `app/admin/dashboard/page.tsx`

**추가할 코드**:

```typescript
// 상태 추가
const [reportDailyStats, setReportDailyStats] = useState<DailyStat[]>([]);

// 보고서 로드 시 일별 통계 가져오기
useEffect(() => {
  if (report?.period) {
    fetchReportDailyStats(
      report.period.startDate,
      report.period.endDate
    );
  }
}, [report]);

const fetchReportDailyStats = async (startDate: string, endDate: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(
      `/api/admin/dashboard?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setReportDailyStats(data.dailyStats || []);
    }
  } catch (error) {
    console.error('Error fetching daily stats:', error);
  }
};

// 그래프 컴포넌트
{reportDailyStats.length > 0 && (
  <div className="mt-6">
    <h4 className="text-md font-semibold text-slate-900 mb-3">일별 트래픽 추이</h4>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={reportDailyStats}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="day"
          stroke="#cbd5e1"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#1e293b' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="pageviews"
          stroke="#06b6d4"
          strokeWidth={2}
          name="페이지뷰"
          dot={{ fill: '#06b6d4', r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="uniques"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="방문자"
          dot={{ fill: '#8b5cf6', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}
```

---

### 2. 이전 기간 비교 그래프

**추가할 코드**:

```typescript
{report.comparison && (
  <div className="mt-6">
    <h4 className="text-md font-semibold text-slate-900 mb-3">이전 기간 대비</h4>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="text-center p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-600 mb-1">페이지뷰 변화</div>
        <div className={`text-2xl font-bold ${
          report.comparison.changes.pageviews.trend === 'up'
            ? 'text-green-600'
            : report.comparison.changes.pageviews.trend === 'down'
            ? 'text-red-600'
            : 'text-slate-600'
        }`}>
          {report.comparison.changes.pageviews.trend === 'up' ? '↑' : 
           report.comparison.changes.pageviews.trend === 'down' ? '↓' : '→'}
          {Math.abs(report.comparison.changes.pageviews.change).toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {((report.comparison.changes.pageviews.change / report.comparison.changes.pageviews.previous) * 100).toFixed(1)}%
        </div>
      </div>
      <div className="text-center p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-600 mb-1">방문자 변화</div>
        <div className={`text-2xl font-bold ${
          report.comparison.changes.uniques.trend === 'up'
            ? 'text-green-600'
            : report.comparison.changes.uniques.trend === 'down'
            ? 'text-red-600'
            : 'text-slate-600'
        }`}>
          {report.comparison.changes.uniques.trend === 'up' ? '↑' : 
           report.comparison.changes.uniques.trend === 'down' ? '↓' : '→'}
          {Math.abs(report.comparison.changes.uniques.change).toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {((report.comparison.changes.uniques.change / report.comparison.changes.uniques.previous) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={[
        {
          name: '페이지뷰',
          현재: report.comparison.changes.pageviews.current,
          이전: report.comparison.changes.pageviews.previous,
        },
        {
          name: '방문자',
          현재: report.comparison.changes.uniques.current,
          이전: report.comparison.changes.uniques.previous,
        },
      ]}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
          }}
        />
        <Legend />
        <Bar dataKey="현재" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        <Bar dataKey="이전" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)}
```

---

### 3. Web Vitals Radar Chart

**추가할 코드**:

```typescript
{report.performance?.webVitals?.metrics && report.performance.webVitals.metrics.length > 0 && (
  <div className="mt-6">
    <h4 className="text-md font-semibold text-slate-900 mb-3">Web Vitals 성능 지표</h4>
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={report.performance.webVitals.metrics.map(m => ({
        metric: m.name,
        value: m.value,
        fullMark: m.name === 'LCP' ? 2500 : m.name === 'CLS' ? 0.25 : m.name === 'INP' ? 500 : 100,
      }))}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fill: '#64748b', fontSize: 10 }} />
        <Radar
          name="값"
          dataKey="value"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.6}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  </div>
)}
```

**필요한 import 추가**:
```typescript
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
```

---

## 📊 그래프별 데이터 소스 요약

| 그래프 | 데이터 소스 | 조회 방법 | 난이도 |
|--------|------------|----------|--------|
| **일별 트래픽 추이** | `getDailyStatsByRange()` | `/api/admin/dashboard?startDate=...&endDate=...` | 낮음 |
| **이전 기간 비교** | `report.comparison` | 보고서 JSON에 포함 | 낮음 |
| **Web Vitals** | `report.performance.webVitals.metrics` | 보고서 JSON에 포함 | 중간 |
| **Top 페이지** | `getTopPages()` | `/api/admin/dashboard` | 낮음 |
| **인사이트 증감률** | `report.insights[].evidence.changePct` | 보고서 JSON에 포함 | 낮음 |

---

## 🎯 권장 구현 순서

1. **1단계**: 일별 트래픽 추이 Line Chart (가장 큰 효과)
2. **2단계**: 이전 기간 비교 Bar Chart (비교 분석 강화)
3. **3단계**: Web Vitals Radar Chart (성능 시각화)
4. **4단계**: Top 페이지 Bar Chart (콘텐츠 인기도)

---

## 💡 추가 개선 아이디어

1. **인터랙티브 차트**
   - 호버 시 상세 정보 표시
   - 클릭 시 해당 날짜/페이지 상세 정보

2. **반응형 디자인**
   - 모바일에서도 잘 보이도록 차트 크기 조절
   - 터치 제스처 지원

3. **애니메이션**
   - 차트 로드 시 부드러운 애니메이션
   - 데이터 변경 시 전환 효과

4. **다운로드 기능**
   - 차트를 이미지로 다운로드
   - PDF 보고서에 차트 포함

---

## 📚 참고 자료

- [Recharts 공식 문서](https://recharts.org/)
- [대시보드 차트 구현 참고](./대시보드_통계_기능_구현_보고서.md)

---

**작성 완료**: 2025-01-16


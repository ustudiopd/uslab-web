# CLS (Cumulative Layout Shift) 개선 방안

**작성일**: 2025-01-25  
**현재 상태**: P75 = 0.437 (Poor), Poor 비율 81.3%  
**목표**: CLS ≤ 0.1 (Good)

---

## 문제 분석

### 현재 CLS 값
- **P50**: 0.424 (Poor)
- **P75**: 0.437 (Poor) 
- **P95**: 0.795 (Poor)
- **Poor 비율**: 81.3% (16개 중 13개)

### CLS 기준
- **Good**: ≤ 0.1
- **Needs Improvement**: 0.1 ~ 0.25
- **Poor**: > 0.25

현재 값은 모두 Poor 범위에 해당하며, 즉각적인 개선이 필요합니다.

---

## 주요 원인 분석

### 1. 이미지에 width/height 속성 부재 (가장 큰 원인)

**현재 상태:**
- `PostViewer.tsx`와 `generate-html.ts`에서 `Image` extension 사용
- 이미지에 `width`/`height` 속성이 없으면 HTML에 렌더링되지 않음
- 이미지가 로드되기 전까지 공간을 차지하지 않아 레이아웃 시프트 발생

**코드 확인:**
```typescript
// components/blog/PostViewer.tsx (51줄)
Image,  // width/height 속성 없이 사용

// lib/utils/generate-html.ts (27줄)
Image,  // width/height 속성 없이 사용
```

**문제점:**
- 이미지가 로드되기 전까지 높이가 0
- 이미지 로드 후 갑자기 공간이 생기면서 레이아웃 시프트 발생
- 특히 블로그 포스트에 이미지가 많을수록 CLS 증가

### 2. 폰트 로딩 (FOUT/FOIT)

**현재 상태:**
```typescript
// app/layout.tsx (8-20줄)
const notoSansKR = Noto_Sans_KR({
  display: 'swap',  // FOUT 발생 가능
});
```

**문제점:**
- `display: 'swap'`은 폰트가 로드되기 전에 fallback 폰트를 표시
- 폰트가 로드되면 텍스트 크기가 변경될 수 있음
- 특히 한글 폰트는 로딩 시간이 길어서 시프트 가능성 높음

### 3. 동적 콘텐츠 삽입

**현재 상태:**
- `PostViewer.tsx`: 링크 설정, 이미지 클릭 이벤트 등이 `useEffect`로 동적 처리
- `MutationObserver`로 DOM 변경 감지 및 처리

**문제점:**
- JavaScript 실행 후 콘텐츠가 변경되면서 레이아웃 시프트 발생 가능

### 4. YouTube iframe

**현재 상태:**
```typescript
// components/blog/PostViewer.tsx (59-68줄)
Youtube.configure({
  width: 0,  // CSS로 제어
  height: 0,  // CSS로 제어
  HTMLAttributes: {
    style: 'width: 100%; aspect-ratio: 16/9;',
  },
}),
```

**문제점:**
- `width: 0, height: 0`으로 설정되어 있어서 초기 공간이 없음
- `aspect-ratio`는 CSS 속성이지만, iframe이 로드되기 전까지는 적용되지 않을 수 있음

---

## 개선 방안

### P0 (즉시 적용 필요)

#### 1. 이미지에 width/height 속성 강제 적용

**방법 A: 이미지 업로드 시 크기 정보 저장**
- 이미지 업로드 API에서 이미지 실제 크기 반환
- 에디터에 이미지 삽입 시 width/height 속성 자동 설정
- 장점: 정확한 크기 정보
- 단점: 기존 이미지는 크기 정보 없음

**방법 B: 이미지 로드 후 크기 측정 및 적용**
- 이미지 로드 완료 후 실제 크기 측정
- `width`/`height` 속성 동적 설정
- 장점: 모든 이미지에 적용 가능
- 단점: 약간의 지연 발생 가능

**방법 C: CSS로 aspect-ratio 강제 적용**
- 이미지에 기본 aspect-ratio 설정
- 이미지 로드 전에도 공간 확보
- 장점: 즉시 적용 가능
- 단점: 정확한 비율이 아닐 수 있음

**권장: 방법 B + C 조합**
- CSS로 기본 공간 확보 (즉시 적용)
- 이미지 로드 후 실제 크기 측정 및 적용 (정확성)

#### 2. 폰트 로딩 최적화

**현재:**
```typescript
display: 'swap',  // FOUT 발생
```

**개선:**
```typescript
display: 'optional',  // 또는 'fallback'
```

또는

```typescript
// 폰트 preload 추가
<link rel="preload" href="/fonts/noto-sans-kr.woff2" as="font" type="font/woff2" crossorigin />
```

#### 3. YouTube iframe 크기 명시

**현재:**
```typescript
width: 0,
height: 0,
```

**개선:**
```typescript
width: 560,  // 표준 YouTube iframe 너비
height: 315,  // 표준 YouTube iframe 높이 (16:9)
```

또는 CSS로:
```css
.youtube-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 315px;  /* 초기 높이 확보 */
}
```

### P1 (단기 개선)

#### 4. 이미지 lazy loading 최적화

**현재:**
- 이미지에 `loading` 속성 없음

**개선:**
```typescript
Image.configure({
  HTMLAttributes: {
    loading: 'lazy',
    decoding: 'async',
  },
})
```

#### 5. 동적 콘텐츠 최소화

- 서버 사이드에서 가능한 한 많은 HTML 생성
- 클라이언트 사이드 DOM 조작 최소화
- `MutationObserver` 사용 최소화

#### 6. CSS로 레이아웃 고정

- 이미지 컨테이너에 `min-height` 설정
- 콘텐츠 영역에 `min-height` 설정
- 레이아웃이 변경되지 않도록 CSS로 고정

---

## 구현 우선순위

### 즉시 적용 (P0)
1. ✅ **이미지에 width/height 속성 강제 적용** (방법 B + C)
2. ✅ **YouTube iframe 크기 명시**
3. ✅ **폰트 로딩 최적화** (`display: 'optional'` 또는 preload)

### 단기 개선 (P1)
4. 이미지 lazy loading 최적화
5. 동적 콘텐츠 최소화
6. CSS로 레이아웃 고정

---

## 예상 효과

- **이미지 width/height 적용**: CLS 50-70% 감소 예상
- **폰트 로딩 최적화**: CLS 10-20% 감소 예상
- **YouTube iframe 크기 명시**: CLS 5-10% 감소 예상

**목표 달성 가능성**: 높음 (P0 개선사항 적용 시 CLS ≤ 0.1 달성 가능)

---

## 참고 자료

- [Web Vitals: CLS](https://web.dev/articles/cls)
- [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [Image dimensions](https://web.dev/articles/optimize-cls#images-without-dimensions)


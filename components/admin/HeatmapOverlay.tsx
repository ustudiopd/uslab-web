'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface HeatmapOverlayProps {
  grid: Record<string, number>;
  gridSize: number;
  totalClicks: number;
  coordMode?: string;
  onClose: () => void;
}

/**
 * 히트맵 오버레이 컴포넌트 v2
 * Phase 3: 뷰포트 고정 캔버스
 * Phase 4: Blob 렌더링 알고리즘 (Blur 누적 + Colorize)
 */
export default function HeatmapOverlay({
  grid,
  gridSize,
  totalClicks,
  coordMode,
  onClose,
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stampCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [maxClicks, setMaxClicks] = useState(1);
  const [docSize, setDocSize] = useState({ width: 0, height: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  
  // v2: 렌더링 설정 (컨트롤 패널에서 조절 가능)
  const [radiusPx, setRadiusPx] = useState(35);
  const [blurPx, setBlurPx] = useState(25);
  const [opacity, setOpacity] = useState(0.65);
  const [maxAlphaClamp] = useState(220);

  // 최대 클릭 수 계산
  useEffect(() => {
    const max = Math.max(...Object.values(grid), 1);
    setMaxClicks(max);
  }, [grid]);

  // 문서 크기 및 스크롤 위치 추적 (변환용)
  useEffect(() => {
    const updateDocSize = () => {
      const width = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        window.innerWidth
      );
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      setDocSize({ width, height });
    };

    const updateScrollPos = () => {
      setScrollPos({
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
      });
    };

    updateDocSize();
    updateScrollPos();
    
    window.addEventListener('resize', updateDocSize);
    window.addEventListener('scroll', updateScrollPos);
    
    const resizeObserver = new ResizeObserver(updateDocSize);
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener('resize', updateDocSize);
      window.removeEventListener('scroll', updateScrollPos);
      resizeObserver.disconnect();
    };
  }, []);

  // Stamp canvas 생성 (원형 그라데이션)
  const createStampCanvas = useCallback((radius: number): HTMLCanvasElement => {
    const stamp = document.createElement('canvas');
    const size = radius * 2;
    stamp.width = size;
    stamp.height = size;
    const ctx = stamp.getContext('2d');
    if (!ctx) return stamp;

    const center = radius;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return stamp;
  }, []);

  // 팔레트 매핑 함수 (알파 → 색상)
  const colorizeAlpha = useCallback((alpha: number): { r: number; g: number; b: number } => {
    // 알파를 0~1로 정규화
    const normalized = Math.min(alpha / maxAlphaClamp, 1);
    
    // 팔레트: 0.0 blue → 0.25 cyan → 0.5 green → 0.75 yellow → 1.0 red
    let r = 0;
    let g = 0;
    let b = 0;

    if (normalized < 0.25) {
      // blue → cyan
      const t = normalized / 0.25;
      r = Math.floor(0 * t);
      g = Math.floor(100 * t);
      b = Math.floor(200 + (55 * t));
    } else if (normalized < 0.5) {
      // cyan → green
      const t = (normalized - 0.25) / 0.25;
      r = Math.floor(0 + (50 * t));
      g = Math.floor(100 + (100 * t));
      b = Math.floor(255 - (155 * t));
    } else if (normalized < 0.75) {
      // green → yellow
      const t = (normalized - 0.5) / 0.25;
      r = Math.floor(50 + (200 * t));
      g = Math.floor(200 - (50 * t));
      b = Math.floor(100 - (100 * t));
    } else {
      // yellow → red
      const t = (normalized - 0.75) / 0.25;
      r = Math.floor(250);
      g = Math.floor(150 - (150 * t));
      b = Math.floor(0);
    }

    return { r, g, b };
  }, [maxAlphaClamp]);

  // Blob 렌더링 (Phase 4)
  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 문서 크기가 아직 계산되지 않았으면 스킵 (초기 로드 시)
    const currentDocW = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      window.innerWidth
    );
    const currentDocH = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );

    if (currentDocW === 0 || currentDocH === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Phase 3: 뷰포트 고정 캔버스
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw;
    canvas.height = vh;

    // 현재 스크롤 위치 (렌더 시점에 직접 읽기 - 최신 값 보장)
    const currentScrollX = window.scrollX || window.pageXOffset || 0;
    const currentScrollY = window.scrollY || window.pageYOffset || 0;

    // Shadow canvas 생성 (offscreen)
    if (!shadowCanvasRef.current) {
      shadowCanvasRef.current = document.createElement('canvas');
    }
    const shadowCanvas = shadowCanvasRef.current;
    shadowCanvas.width = vw;
    shadowCanvas.height = vh;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (!shadowCtx) return;

    // Shadow canvas 초기화
    shadowCtx.clearRect(0, 0, vw, vh);

    // Stamp canvas 생성/재생성 (radius 변경 시)
    if (!stampCanvasRef.current || stampCanvasRef.current.width !== radiusPx * 2) {
      stampCanvasRef.current = createStampCanvas(radiusPx);
    }
    const stamp = stampCanvasRef.current;

    // 그리드 데이터를 점으로 변환하여 shadow canvas에 누적
    Object.entries(grid).forEach(([key, clicks]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      
      // 그리드 중심 좌표를 문서 기준 좌표(0~1)로 변환
      const nx = (gridX + 0.5) / gridSize;
      const ny = (gridY + 0.5) / gridSize;

      // 문서 픽셀 좌표로 변환 (렌더 시점의 문서 크기 사용)
      const docX = nx * currentDocW;
      const docY = ny * currentDocH;

      // 화면 좌표로 변환 (스크롤 보정 - 렌더 시점의 스크롤 위치 사용)
      const screenX = docX - currentScrollX;
      const screenY = docY - currentScrollY;

      // 화면 밖 포인트 skip (성능 최적화)
      const R = radiusPx;
      if (screenX < -R || screenX > vw + R || screenY < -R || screenY > vh + R) {
        return;
      }

      // 클릭 수에 따른 강도 계산
      const intensity = Math.min(clicks / maxClicks, 1);
      
      // Shadow canvas에 stamp 그리기 (blur 적용)
      shadowCtx.save();
      shadowCtx.globalCompositeOperation = 'screen'; // 알파 누적
      shadowCtx.globalAlpha = intensity;
      shadowCtx.filter = `blur(${blurPx}px)`; // 추가 개선 1: Canvas filter 사용
      shadowCtx.drawImage(stamp, screenX - radiusPx, screenY - radiusPx);
      shadowCtx.restore();
    });

    // Shadow canvas의 알파를 읽어서 색상으로 변환
    const imageData = shadowCtx.getImageData(0, 0, vw, vh);
    const data = imageData.data;

    // 알파 값을 색상으로 매핑
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const { r, g, b } = colorizeAlpha(alpha);
        data[i] = r;     // R
        data[i + 1] = g; // G
        data[i + 2] = b; // B
        data[i + 3] = Math.floor(alpha * opacity); // A (opacity 적용)
      }
    }

    // 메인 캔버스에 최종 렌더링
    ctx.putImageData(imageData, 0, 0);
  }, [grid, gridSize, maxClicks, radiusPx, blurPx, opacity, createStampCanvas, colorizeAlpha]);

  // 렌더링 실행 (스크롤은 즉시, 리사이즈는 throttle)
  useEffect(() => {
    let resizeRafId: number | null = null;
    
    // 초기 렌더링
    renderHeatmap();

    // 스크롤 시 즉시 렌더링 (딜레이 없음)
    const handleScroll = () => {
      renderHeatmap();
    };

    // 리사이즈 시 throttle 적용 (성능 최적화)
    const handleResize = () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        renderHeatmap();
        resizeRafId = null;
      });
    };

    // 스크롤 이벤트는 즉시 처리 (passive로 성능 최적화)
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderHeatmap]);

  return (
    <>
      {/* Phase 3: 뷰포트 고정 캔버스 */}
      <div className="fixed top-0 left-0 w-screen h-screen z-50 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            pointerEvents: 'none',
            width: '100vw',
            height: '100vh',
          }}
        />
      </div>

      {/* 컨트롤 패널 - 뷰포트에 고정 */}
      <div className="fixed top-4 right-4 z-[60] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-4 shadow-lg pointer-events-auto max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">히트맵</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* v2: 렌더링 설정 컨트롤 */}
        <div className="space-y-3 text-xs mb-3">
          <div>
            <label className="block text-slate-700 mb-1">
              반경: {radiusPx}px
            </label>
            <input
              type="range"
              min="15"
              max="60"
              value={radiusPx}
              onChange={(e) => setRadiusPx(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-1">
              블러: {blurPx}px
            </label>
            <input
              type="range"
              min="10"
              max="40"
              value={blurPx}
              onChange={(e) => setBlurPx(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-1">
              투명도: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/50 rounded"></div>
            <span className="text-slate-600">낮음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/70 rounded"></div>
            <span className="text-slate-600">중간</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/80 rounded"></div>
            <span className="text-slate-600">높음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/90 rounded"></div>
            <span className="text-slate-600">매우 높음</span>
          </div>
        </div>

        {/* 통계 */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-600">
            <div>총 클릭: {totalClicks.toLocaleString()}</div>
            <div>최대 집중도: {maxClicks}회</div>
            {coordMode && (
              <div className="text-slate-500 mt-1">좌표: {coordMode === 'page' ? '문서 기준' : '뷰포트 기준'}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

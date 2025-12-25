'use client';

import { useEffect, useRef, useState } from 'react';

interface HeatmapOverlayProps {
  grid: Record<string, number>;
  gridSize: number;
  totalClicks: number;
  onClose: () => void;
}

/**
 * 히트맵 오버레이 컴포넌트
 * 페이지 위에 클릭 집중도를 색상으로 시각화
 */
export default function HeatmapOverlay({
  grid,
  gridSize,
  totalClicks,
  onClose,
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxClicks, setMaxClicks] = useState(1);
  const [docSize, setDocSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // 그리드에서 최대 클릭 수 찾기
    const max = Math.max(...Object.values(grid), 1);
    setMaxClicks(max);
  }, [grid]);

  // 전체 문서 크기 추적
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

    updateDocSize();
    window.addEventListener('resize', updateDocSize);
    window.addEventListener('scroll', updateDocSize);
    
    const resizeObserver = new ResizeObserver(updateDocSize);
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener('resize', updateDocSize);
      window.removeEventListener('scroll', updateDocSize);
      resizeObserver.disconnect();
    };
  }, []);

  // 히트맵 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || docSize.width === 0 || docSize.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기를 전체 문서 크기에 맞춤
    canvas.width = docSize.width;
    canvas.height = docSize.height;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 그리드 셀 크기 계산 (전체 문서 기준)
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    // 각 그리드 셀에 색상 적용
    Object.entries(grid).forEach(([key, clicks]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const x = gridX * cellWidth;
      const y = gridY * cellHeight;

      // 클릭 수에 따른 색상 강도 계산 (0~1)
      const intensity = Math.min(clicks / maxClicks, 1);

      // 색상 그라데이션: 파란색(낮음) -> 녹색(중간) -> 노란색(높음) -> 빨간색(매우 높음)
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (intensity < 0.25) {
        // 파란색 (낮음)
        const t = intensity / 0.25;
        r = 0;
        g = Math.floor(100 * t);
        b = Math.floor(200 * t);
        a = 0.3 * t;
      } else if (intensity < 0.5) {
        // 녹색 (중간)
        const t = (intensity - 0.25) / 0.25;
        r = Math.floor(50 * t);
        g = Math.floor(150 + 50 * t);
        b = Math.floor(200 - 100 * t);
        a = 0.3 + 0.2 * t;
      } else if (intensity < 0.75) {
        // 노란색 (높음)
        const t = (intensity - 0.5) / 0.25;
        r = Math.floor(50 + 150 * t);
        g = Math.floor(200 - 50 * t);
        b = Math.floor(100 - 100 * t);
        a = 0.5 + 0.2 * t;
      } else {
        // 빨간색 (매우 높음)
        const t = (intensity - 0.75) / 0.25;
        r = Math.floor(200 + 55 * t);
        g = Math.floor(150 - 150 * t);
        b = 0;
        a = 0.7 + 0.3 * t;
      }

      // 그리드 셀에 색상 적용
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    });
  }, [grid, gridSize, maxClicks, docSize]);

  return (
    <>
      {/* 히트맵 오버레이 컨테이너 - 전체 문서 크기로 설정 */}
      <div
        ref={containerRef}
        className="fixed top-0 left-0 z-50 pointer-events-none"
        style={{
          width: `${docSize.width}px`,
          height: `${docSize.height}px`,
        }}
      >
        {/* 히트맵 캔버스 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ 
            pointerEvents: 'none',
            width: `${docSize.width}px`,
            height: `${docSize.height}px`,
          }}
        />
      </div>

      {/* 컨트롤 패널 - 뷰포트에 고정 */}
      <div className="fixed top-4 right-4 z-[60] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-4 shadow-lg pointer-events-auto">
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

        {/* 범례 */}
        <div className="space-y-2 text-xs">
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
          </div>
        </div>
      </div>
    </>
  );
}

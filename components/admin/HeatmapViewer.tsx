'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import HeatmapOverlay from './HeatmapOverlay';

interface HeatmapViewerProps {
  pagePath: string;
}

/**
 * 히트맵 뷰어 컴포넌트
 * 쿼리 파라미터로 히트맵 모드 활성화 시 히트맵 오버레이 표시
 */
export default function HeatmapViewer({ pagePath }: HeatmapViewerProps) {
  const searchParams = useSearchParams();
  const showHeatmap = searchParams.get('heatmap') === 'true';
  
  // v2: 필터 옵션 상태
  const [days, setDays] = useState(30);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [gridSize, setGridSize] = useState(200);
  
  // v2: 추가 개선 3 - 디바이스 필터 기본값 자동 설정
  const defaultDevice = useMemo(() => {
    if (typeof window === 'undefined') return 'all';
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  }, []);

  // 초기 로드 시 기본값 설정
  useEffect(() => {
    if (showHeatmap && deviceFilter === 'all') {
      setDeviceFilter(defaultDevice);
    }
  }, [showHeatmap, defaultDevice, deviceFilter]);

  const [heatmapData, setHeatmapData] = useState<{
    grid: Record<string, number>;
    gridSize: number;
    totalClicks: number;
    coordMode?: string;
    filteredBy?: { device: string };
    samplingWarning?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showHeatmap) {
      setHeatmapData(null);
      return;
    }

    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 세션 토큰 가져오기
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('인증이 필요합니다. 관리자로 로그인해주세요.');
          setLoading(false);
          return;
        }

        const encodedPath = encodeURIComponent(pagePath);
        // v2: query param 추가
        const queryParams = new URLSearchParams({
          days: days.toString(),
          grid: gridSize.toString(),
          device: deviceFilter,
        });
        
        const response = await fetch(`/api/admin/heatmap/${encodedPath}?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('히트맵 데이터를 가져올 수 없습니다.');
        }

        const data = await response.json();
        setHeatmapData({
          grid: data.grid || {},
          gridSize: data.stats?.gridSize || 200,
          totalClicks: data.stats?.totalClicks || 0,
          coordMode: data.stats?.coordMode,
          filteredBy: data.stats?.filteredBy,
          samplingWarning: data.stats?.samplingWarning,
        });
      } catch (err: any) {
        console.error('Error fetching heatmap:', err);
        setError(err.message || '히트맵 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [showHeatmap, pagePath, days, deviceFilter, gridSize]);

  const handleClose = () => {
    // 히트맵 모드 종료 (쿼리 파라미터 제거)
    const url = new URL(window.location.href);
    url.searchParams.delete('heatmap');
    window.history.replaceState({}, '', url.toString());
    setHeatmapData(null);
  };

  if (!showHeatmap) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="text-slate-900 font-medium">히트맵 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
          <div className="text-red-600 font-medium mb-2">오류</div>
          <div className="text-sm text-slate-600 mb-4">{error}</div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (!heatmapData || heatmapData.totalClicks === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
          <div className="text-slate-900 font-medium mb-2">히트맵 데이터 없음</div>
          <div className="text-sm text-slate-600 mb-4">
            이 페이지에 대한 클릭 데이터가 아직 수집되지 않았습니다.
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* v2: 필터 옵션 컨트롤 패널 */}
      <div className="fixed top-4 left-4 z-[60] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-4 shadow-lg pointer-events-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">히트맵 설정</h3>
          <button
            onClick={handleClose}
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

        <div className="space-y-3 text-xs">
          {/* 기간 선택 */}
          <div>
            <label className="block text-slate-700 mb-1">기간</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 bg-white"
            >
              <option value={7}>7일</option>
              <option value={30}>30일</option>
            </select>
          </div>

          {/* 디바이스 필터 */}
          <div>
            <label className="block text-slate-700 mb-1">디바이스</label>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as 'all' | 'mobile' | 'desktop')}
              className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 bg-white"
            >
              <option value="all">전체</option>
              <option value="mobile">모바일</option>
              <option value="desktop">데스크톱</option>
            </select>
          </div>

          {/* 그리드 크기 */}
          <div>
            <label className="block text-slate-700 mb-1">해상도</label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 bg-white"
            >
              <option value={100}>100×100</option>
              <option value={200}>200×200 (권장)</option>
              <option value={300}>300×300</option>
            </select>
          </div>

          {/* 샘플링 경고 */}
          {heatmapData.samplingWarning && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              {heatmapData.samplingWarning}
            </div>
          )}
        </div>
      </div>

      <HeatmapOverlay
        grid={heatmapData.grid}
        gridSize={heatmapData.gridSize}
        totalClicks={heatmapData.totalClicks}
        coordMode={heatmapData.coordMode}
        onClose={handleClose}
      />
    </>
  );
}


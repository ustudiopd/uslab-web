'use client';

import { useEffect, useState } from 'react';
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
  const [heatmapData, setHeatmapData] = useState<{
    grid: Record<string, number>;
    gridSize: number;
    totalClicks: number;
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
        const response = await fetch(`/api/admin/heatmap/${encodedPath}?days=30`, {
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
          gridSize: data.stats?.gridSize || 20,
          totalClicks: data.stats?.totalClicks || 0,
        });
      } catch (err: any) {
        console.error('Error fetching heatmap:', err);
        setError(err.message || '히트맵 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [showHeatmap, pagePath]);

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
    <HeatmapOverlay
      grid={heatmapData.grid}
      gridSize={heatmapData.gridSize}
      totalClicks={heatmapData.totalClicks}
      onClose={handleClose}
    />
  );
}


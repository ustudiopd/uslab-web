'use client';

import { Suspense } from 'react';
import ExecBoardTab from '@/components/admin/exec-board/ExecBoardTab';

function ExecBoardContent() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2 leading-tight sm:leading-normal">
          운영진 보드
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">운영진 내부 문서 및 공지 관리</p>
      </div>

      {/* 운영진 보드 컨텐츠 */}
      <ExecBoardTab />
    </div>
  );
}

export default function ExecBoardPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <p className="text-slate-600 text-sm sm:text-base">로딩 중...</p>
      </div>
    }>
      <ExecBoardContent />
    </Suspense>
  );
}


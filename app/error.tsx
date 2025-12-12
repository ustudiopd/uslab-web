'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Something went wrong!</h1>
        <p className="text-slate-400 mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}




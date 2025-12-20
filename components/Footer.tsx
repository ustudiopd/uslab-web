'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 dark:bg-slate-950 bg-white border-t border-slate-900 dark:border-slate-900 border-slate-300 py-12 text-sm text-slate-500 dark:text-slate-500 text-slate-700">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 dark:text-slate-300 text-slate-800">
            USLab <span className="text-cyan-500 dark:text-cyan-500">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 text-slate-600">
            {t('footer.familySites')}
          </span>
          <a
            href="https://www.ustudio.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 dark:text-slate-500 text-slate-700 hover:text-cyan-500 transition-colors text-xs"
          >
            U-Studio
          </a>
          <a
            href="https://www.modoolecture.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 dark:text-slate-500 text-slate-700 hover:text-cyan-500 transition-colors text-xs"
          >
            Modoolecture
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-xs font-mono text-slate-500 dark:text-slate-700 text-slate-600">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}






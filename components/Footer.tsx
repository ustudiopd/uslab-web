'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 dark:border-slate-900 py-12 text-sm text-slate-400 dark:text-slate-500">
      <div className="w-full max-w-1160 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="mb-4 md:mb-0">
          <span className="text-xl font-bold text-white tracking-tight mr-4">
            USLab <span className="text-blue-500">AI</span>
          </span>
          <span>© 2025 All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400">
            {t('footer.familySites')}
          </span>
          <a
            href="https://www.ustudio.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors text-xs"
          >
            U-Studio
          </a>
          <a
            href="https://www.modoolecture.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors text-xs"
          >
            Modoolecture
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-xs font-mono text-slate-400">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}






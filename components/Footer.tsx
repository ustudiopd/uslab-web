'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 dark:bg-slate-950 bg-white border-t border-slate-900 dark:border-slate-900 border-slate-200 py-12 text-sm text-slate-500 dark:text-slate-500 text-slate-600">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 dark:bg-slate-800 bg-slate-200 rounded flex items-center justify-center dark:text-white text-slate-900 font-mono font-bold text-xs">
            US
          </div>
          <span className="font-bold text-slate-300 dark:text-slate-300 text-slate-700">USlab.ai</span>
        </div>

        <div className="flex gap-6">
          <Link href="#" className="text-slate-500 dark:text-slate-500 text-slate-600 hover:text-cyan-400 transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link href="#" className="text-slate-500 dark:text-slate-500 text-slate-600 hover:text-cyan-400 transition-colors">
            {t('footer.terms')}
          </Link>
        </div>

        <div className="flex gap-4 text-lg">
          <a
            href="#"
            className="text-slate-500 dark:text-slate-500 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 transition-colors"
            aria-label="GitHub"
          >
            <i className="fab fa-github" />
          </a>
          <a
            href="#"
            className="text-slate-500 dark:text-slate-500 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 transition-colors"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin" />
          </a>
          <a
            href="#"
            className="text-slate-500 dark:text-slate-500 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 transition-colors"
            aria-label="Email"
          >
            <i className="fas fa-envelope" />
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-xs font-mono text-slate-500 dark:text-slate-700 text-slate-500">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}






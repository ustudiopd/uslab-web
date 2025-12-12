'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 text-sm text-slate-500">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white font-mono font-bold text-xs">
            US
          </div>
          <span className="font-bold text-slate-300">USlab.ai</span>
        </div>

        <div className="flex gap-6">
          <Link href="#" className="hover:text-cyan-400 transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link href="#" className="hover:text-cyan-400 transition-colors">
            {t('footer.terms')}
          </Link>
        </div>

        <div className="flex gap-4 text-lg">
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <i className="fab fa-github" />
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin" />
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
            aria-label="Email"
          >
            <i className="fas fa-envelope" />
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-xs font-mono text-slate-700">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}



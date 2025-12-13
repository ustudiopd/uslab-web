'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import type { Locale } from '@/lib/i18n/config';

interface ThemeToggleProps {
  lang: Locale;
}

export default function ThemeToggle({ lang }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // SSR hydration 이슈 방지
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg border bg-slate-800 dark:bg-slate-800 bg-slate-100 border-slate-700 dark:border-slate-700 border-slate-300 text-slate-400 dark:text-slate-400 text-slate-600"
        aria-label={lang === 'ko' ? '테마 전환' : 'Toggle theme'}
        disabled
      >
        <Sun size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border transition-colors bg-slate-800 dark:bg-slate-800 bg-slate-100 border-slate-700 dark:border-slate-700 border-slate-300 text-slate-400 dark:text-slate-400 text-slate-600 hover:border-cyan-500 dark:hover:border-cyan-500 hover:text-cyan-400 dark:hover:text-cyan-400 hover:text-cyan-600"
      aria-label={lang === 'ko' ? '테마 전환' : 'Toggle theme'}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

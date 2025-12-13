'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  // 다크 테마만 사용 (항상 'dark'로 고정)
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 다크 테마만 강제 적용
    setTheme('dark');
    document.documentElement.classList.add('dark');
    // localStorage에 다크 테마 저장 (다른 곳에서 읽을 때를 대비)
    localStorage.setItem('theme', 'dark');
  }, []);

  // 테마 토글 기능 비활성화 (항상 다크 테마 유지)
  const toggleTheme = () => {
    // 아무 동작도 하지 않음 (다크 테마만 사용)
    setTheme('dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  };

  return { theme, toggleTheme, mounted };
}

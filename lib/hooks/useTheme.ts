'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  // 라이트 테마를 기본값으로 사용 (향후 다크/라이트 토글 기능 추가 예정)
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 라이트 테마 강제 적용
    setTheme('light');
    document.documentElement.classList.remove('dark');
    // localStorage에 라이트 테마 저장
    localStorage.setItem('theme', 'light');
    
    /* 다크 테마 코드 (향후 토글 기능 추가 시 사용)
    // 다크 테마만 사용 (항상 'dark'로 고정)
    setTheme('dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    */
  }, []);

  // 테마 토글 기능 비활성화 (향후 다크/라이트 토글 기능 추가 예정)
  const toggleTheme = () => {
    // 현재는 라이트 테마만 사용 (향후 토글 기능 추가 시 활성화)
    setTheme('light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    /* 다크 테마 토글 코드 (향후 토글 기능 추가 시 사용)
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
    */
  };

  return { theme, toggleTheme, mounted };
}

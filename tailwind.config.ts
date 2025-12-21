import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        slate: {
          850: '#151e2e',
          950: '#020617',
        },
        cyan: {
          450: '#00a3cc',
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
        /* 다크 테마용 grid-pattern (향후 토글 기능 추가 시 사용)
        'grid-pattern-dark':
          'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
        */
      },
      boxShadow: {
        'blue-glow': '0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 8px 10px -6px rgba(59, 130, 246, 0.1)',
      },
      maxWidth: {
        '1160': '1160px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;













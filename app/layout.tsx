import type { Metadata } from 'next';
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Tracker from '@/components/analytics/Tracker';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'USLab.ai | AI 역량 강화',
  description: 'AI 대전환(AX), 이제 모두를 위한 기술이 됩니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 다크 테마만 강제 적용
                document.documentElement.classList.add('dark');
                // localStorage의 테마 설정 무시
                localStorage.setItem('theme', 'dark');
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSansKR.variable} ${jetbrainsMono.variable} antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        {children}
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
      </body>
    </html>
  );
}













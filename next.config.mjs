/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 개발 서버 성능 최적화
  experimental: {
    // 개발 모드에서 빠른 리프레시
    optimizePackageImports: ['lucide-react', '@tiptap/react', '@tiptap/starter-kit'],
  },
  
  // Turbopack 명시적 활성화 (Next.js 16 기본값)
  turbopack: {},
  
  // TypeScript 컴파일 최적화
  typescript: {
    // 개발 중 타입 체크 건너뛰기 (빌드 시에는 체크)
    ignoreBuildErrors: false,
  },
  
  // 이미지 도메인 설정 (Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // 파일 감시 설정 (Windows 환경 최적화)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경 체크
        aggregateTimeout: 300, // 변경 후 300ms 대기
      };
    }
    return config;
  },
};

export default nextConfig;






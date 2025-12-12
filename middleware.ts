import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ko', 'en'];
const defaultLocale = 'ko';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API, static files, Next.js internals는 제외
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 어드민 페이지는 언어 prefix 없이 접근 (언어와 무관)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 이미 locale이 포함된 경로인지 확인
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // localStorage에서 저장된 언어 확인 (쿠키로 전달)
    const storedLocale = request.cookies.get('locale')?.value;
    const locale = (storedLocale && locales.includes(storedLocale)) ? storedLocale : defaultLocale;

    // /ko 또는 /en으로 리다이렉트
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};




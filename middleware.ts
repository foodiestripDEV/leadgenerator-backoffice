import { NextRequest, NextResponse } from 'next/server';
import { isJwtValid, COOKIE_NAME } from '@/lib/auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes – always allow
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token || !isJwtValid(token)) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

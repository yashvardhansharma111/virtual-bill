import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes
 * Checks for admin authentication via session cookie
 * 
 * Note: Next.js 16 shows a deprecation warning for middleware.ts
 * This is expected and the middleware still works correctly.
 * The warning can be safely ignored until Next.js provides migration guidance.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session');

    // Check if admin is authenticated
    if (!adminSession || adminSession.value !== 'authenticated') {
      // Redirect to admin login if not authenticated
      if (pathname !== '/admin/login') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
  // Exclude /admin/login from matcher, but we handle it in the function
};

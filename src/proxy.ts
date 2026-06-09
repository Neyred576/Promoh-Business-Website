import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Named export `proxy` is required in Next.js 16+ (replaces `middleware`)
export function proxy(request: NextRequest) {
  // Protect admin dashboard routes
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    const adminSession = request.cookies.get('admin_session');

    // Check if the secure session cookie exists and has the correct value
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};

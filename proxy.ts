import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_API = [/^\/api\/wallet/, /^\/api\/qr/, /^\/api\/offers\/accept/];

// Next.js 16: Renamed from middleware() to proxy()
// proxy.ts runs on Node.js runtime (Edge runtime deprecated for middleware)
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Protected API routes check
  const isProtected = PROTECTED_API.some(rx => rx.test(pathname));
  if (isProtected && !req.cookies.get('zzik_session')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  
  // Block /feed route when FEATURE_FEED_LABS is not enabled
  if (pathname.startsWith('/feed')) {
    const feedEnabled = process.env.FEATURE_FEED_LABS === 'true';
    
    if (!feedEnabled) {
      // Return 404 for feed routes when feature is disabled
      return new NextResponse('Not Found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  }
  
  // Security headers for all routes
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths including API routes for protection
     * Exclude only:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

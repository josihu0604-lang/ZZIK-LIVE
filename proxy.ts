import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16: Renamed from middleware() to proxy()
// proxy.ts runs on Node.js runtime (Edge runtime deprecated for middleware)
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
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
     * Match all request paths except:
     * - api routes (API should handle their own security)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

const APP_ORIGIN = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').origin;

// Public paths that don't require any authentication
const PUBLIC_PATHS = [
  '/splash',
  '/onboarding',
  '/auth',
  '/pass', // Allow guest access to browse/explore
  '/explore', // Allow guest access to explore
  '/content', // Allow guest access to content (renamed from feed)
  '/_next',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/api/health',
  '/api/analytics',
  '/api/auth',
  '/api/places', // Public place queries
  '/api/search', // Public search
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return false;
  return PUBLIC_PATHS.some((pub) => pathname.startsWith(pub));
}

// Protected paths that require full authentication (no guest)
const PROTECTED_PATHS = ['/scan', '/wallet', '/offers'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) =>
      pathname === path || pathname.startsWith(path + '/') || pathname.startsWith(path + '?')
  );
}

// Next.js 16: Renamed from middleware() to proxy()
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Generate request ID for tracing
  const requestId = `req_${nanoid(16)}`;

  // Check authentication
  const session = req.cookies.get('zzik_session')?.value;
  const token = req.cookies.get('zzik_token')?.value;
  const zl_auth = req.cookies.get('zl_auth')?.value;
  const guest = req.cookies.get('zzik_guest')?.value === '1';
  const isAuthenticated = !!(session || token || zl_auth);

  // Content route is always available (renamed from feed)

  // Allow public paths for everyone
  if (isPublicPath(pathname)) {
    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // Protected API routes - require full authentication (no guest)
  const PROTECTED_API = [/^\/api\/wallet/, /^\/api\/qr/, /^\/api\/offers\/accept/];
  const isProtectedAPI = PROTECTED_API.some((rx) => rx.test(pathname));

  if (isProtectedAPI && !isAuthenticated) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Protected paths require full authentication
  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Non-authenticated, non-guest users go to splash
  if (!isAuthenticated && !guest && !pathname.startsWith('/api/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/splash';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users trying to access auth pages
  if (isAuthenticated && pathname.startsWith('/auth/') && !pathname.includes('logout')) {
    return NextResponse.redirect(new URL('/content', req.url));
  }

  // Create response with security headers
  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions Policy
  res.headers.set(
    'Permissions-Policy',
    [
      'camera=(self)',
      'geolocation=(self)',
      'microphone=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',
    ].join(', ')
  );

  // CSP nonce injection
  const nonce = nanoid(16);
  res.headers.set('x-csp-nonce', nonce);

  // Content Security Policy
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://api.mapbox.com`,
    `img-src 'self' data: blob: https://*.mapbox.com https://*.cloudflare.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.mapbox.com https://*.mapbox.com wss://*.mapbox.com https://*.supabase.co`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ];

  if (process.env.NODE_ENV === 'development') {
    cspDirectives[1] = `script-src 'self' 'unsafe-eval' 'nonce-${nonce}'`;
    cspDirectives[5] = `connect-src 'self' ws: wss: https://api.mapbox.com https://*.mapbox.com https://*.supabase.co`;
  }

  res.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // QR verify CORS enforcement
  if (pathname.startsWith('/api/qr/verify')) {
    const origin = req.headers.get('origin') ?? '';
    if (origin && origin !== APP_ORIGIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const idempotencyKey = req.headers.get('idempotency-key');
    if (!idempotencyKey) {
      return new NextResponse('Idempotency-Key header required', { status: 400 });
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

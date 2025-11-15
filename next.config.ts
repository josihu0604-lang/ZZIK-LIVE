import type { NextConfig } from 'next';

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

// Environment detection
const isProd = process.env.NODE_ENV === 'production';

// Mapbox whitelist for CSP
const mapboxConnect = [
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com',
  'https://*.mapbox.com',
];

// Enhanced CSP with production/development split
const cspProd = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'", // Critical: Prevent clickjacking
  `connect-src 'self' ${mapboxConnect.join(' ')} https://*.supabase.co`,
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'", // Progressive: Plan to migrate to hash/nonce
  "script-src 'self' 'strict-dynamic'", // Removed unsafe-eval for production
  "worker-src 'self' blob:",
  "object-src 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

// Development CSP: More permissive for HMR and dev tools
const cspDev = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  `connect-src 'self' ${mapboxConnect.join(' ')} https://*.supabase.co ws: wss:`,
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Dev tools require eval/inline
  "worker-src 'self' blob:",
  "object-src 'none'",
  "manifest-src 'self'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=(), payment=()',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }, // COEP for enhanced isolation
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Origin-Agent-Cluster', value: '?1' },
          { key: 'Content-Security-Policy', value: isProd ? cspProd : cspDev },
          // Note: CSP production mode removes unsafe-eval; dev mode allows HMR
        ],
      },
      {
        // QR verification: CORS completely blocked (same-origin only)
        source: '/api/qr/verify',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'null' }, // Explicitly block CORS
        ],
      },
      {
        // Enhanced security headers for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'none'; connect-src 'self'",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=(self)' },
        ],
      },
    ];
  },
  // Webpack optimization configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client-side bundle
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        concatenateModules: true,
      };
    }
    return config;
  },
  // Bundle size optimization
  productionBrowserSourceMaps: false, // Disable source maps in production
  compress: true,
  poweredByHeader: false, // Remove X-Powered-By header
};

export default withBundleAnalyzer(nextConfig);

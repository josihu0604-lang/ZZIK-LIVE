import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import '../styles/tokens.css';

// Geist for Latin characters - Modern, clean design
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: true, // Better CLS prevention
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['monospace'],
  adjustFontFallback: true,
});

// Noto Sans KR for Korean characters - Optimized for readability
const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['sans-serif'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'ZZIK LIVE - 나노 크리에이터 × 로컬 비즈니스 매칭 플랫폼',
  description:
    'GPS+QR+영수증 삼중 검증 시스템으로 나노 크리에이터와 로컬 비즈니스를 연결하는 로컬 마케팅 플랫폼',
  keywords: '로컬, 릴스, 지도, GPS, QR코드, 영수증, 할인, 쿠폰, 바우처, 나노 크리에이터',
  authors: [{ name: 'ZZIK LIVE Team' }],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://zzik.live',
    title: 'ZZIK LIVE',
    description: '삼중 검증으로 허위 리뷰 차단, 진짜 로컬 경험',
    siteName: 'ZZIK LIVE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZZIK LIVE',
    description: '삼중 검증으로 허위 리뷰 차단',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover', // Safe-area support for notch
  themeColor: '#0B0F14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          notoSansKR.variable,
          'antialiased',
          'zzik-app-shell',
        ].join(' ')}
      >
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

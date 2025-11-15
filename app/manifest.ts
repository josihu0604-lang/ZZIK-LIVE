import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZZIK LIVE - 지도 기반 실시간 경험 플랫폼',
    short_name: 'ZZIK LIVE',
    description:
      '지도를 중심으로 실시간 오퍼, QR 인증, 영수증 검증을 통해 리워드를 받는 혁신적인 로컬 경험 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    orientation: 'portrait-primary',
    categories: ['lifestyle', 'shopping', 'social'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-mobile-1.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      {
        name: '피드',
        short_name: '피드',
        description: '실시간 피드 보기',
        url: '/feed',
        icons: [{ src: '/icon-feed.png', sizes: '96x96' }],
      },
      {
        name: 'QR 스캔',
        short_name: '스캔',
        description: 'QR 코드 스캔하기',
        url: '/scan',
        icons: [{ src: '/icon-scan.png', sizes: '96x96' }],
      },
      {
        name: '지갑',
        short_name: '지갑',
        description: '내 지갑 보기',
        url: '/wallet',
        icons: [{ src: '/icon-wallet.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}

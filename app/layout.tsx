import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZZIK LIVE - 나노 크리에이터 × 로컬 비즈니스 매칭 플랫폼",
  description: "GPS 기반 삼중 검증 시스템으로 나노 크리에이터와 로컬 비즈니스를 연결하는 혁신적인 마케팅 플랫폼",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

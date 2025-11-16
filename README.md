# ZZIK LIVE

나노 크리에이터 × 로컬 비즈니스 매칭 플랫폼

## 🌐 개발 서버 (고정 주소)

**Live Demo:** https://3000-ika6c7p2vsovx61qfxeth-5185f4aa.sandbox.novita.ai

**API Health Check:** https://3000-ika6c7p2vsovx61qfxeth-5185f4aa.sandbox.novita.ai/api/health

**진행 상황:** ㄱ10 완료 - Production-Ready Infrastructure

## 🚀 프로젝트 개요

GPS 기반 삼중 검증 시스템으로 나노 크리에이터(팔로워 100~10,000명)와 로컬 비즈니스를 연결하는 혁신적인 마케팅 플랫폼입니다.

### 핵심 차별점

- **GPS 위치 추적** + **QR 코드 스캔** + **영수증 사진 업로드** 삼중 검증
- 실내 정확도 3미터 이내의 위치 검증 (Wi-Fi 삼각측량 + iBeacon)
- 실제 방문 없이는 미션 완료 불가능

## 📱 주요 기능

### 4-Tab 네비게이션

1. **체험권 (Pass/LIVE)**: 검색, 필터, LIVE 릴스, Mapbox 지도
2. **받은 오퍼 (Offers)**: 브랜드 맞춤 제안, 만료 알림
3. **QR 스캔 (Scan)**: 실시간 카메라 스캔, 체험권 사용
4. **지갑 (Wallet)**: 포인트/스탬프, 체험권 관리

## 🛠 기술 스택

- **Framework**: Next.js 16 (App Router) with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **State**: React Hooks
- **Database**: Prisma ORM + PostgreSQL
- **Cache**: Redis with ioredis
- **Queue**: Redis Queue System (Bull)
- **Payments**: Toss Payments, Naver Pay
- **Maps**: Mapbox GL JS
- **Testing**: Playwright (E2E), Vitest (Unit)
- **GPS**: Kalman Filter + Enhanced GPS Service

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 생성)
cp .env.example .env.local

# 개발 서버 실행 (포트 3000 고정)
PORT=3000 npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버
npm start

# E2E 테스트
npm run test:e2e

# 유닛 테스트
npm run test
```

## 🎯 최근 업데이트 (ㄱ9 + ㄱ10)

### ㄱ9: Geofence Accuracy Enhancement
- ✅ Kalman Filter GPS 스무딩
- ✅ Enhanced GPS Service (신뢰도 스코어)
- ✅ 3단계 검증 (Allow/Warn/Block)
- ✅ 정확도 원 & 거리/ETA 배지
- ✅ 마커 회색화 & 사전검증

### ㄱ10: Production-Ready Infrastructure
- ✅ GPS 시뮬레이터 (7가지 패턴)
- ✅ E2E 테스트 스위트 (11개 테스트)
- ✅ Redis 캐시 레이어
- ✅ 에러 바운더리 & 자동 복구
- ✅ 실시간 텔레메트리 대시보드

## 📊 모니터링

**텔레메트리 대시보드:** `/admin/telemetry`
- 실시간 GPS 정확도 모니터링
- Allow/Warn/Block 비율
- 캐시 히트율
- 성능 메트릭

## 📄 라이선스

Copyright © 2024 ZZIK LIVE. All rights reserved.
# 🎆 ZZIK LIVE

> 삼중 검증(GPS × QR × 영수증) 기반 위치 기반 실시간 경험 플랫폼

## 🎯 핵심 가치

- **지도 × LIVE 릴스**: 실시간 로켈 컨텐츠 탐색 및 체험
- **삼중 검증**: GPS + QR + 영수증으로 허위 리뷰 원천 차단
- **B2B 비즈니스 모델**: 월 구독 + 성과 기반 보상 수수료

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값 설정

# 3. 데이터베이스 시작
npm run db:up

# 4. 마이그레이션 실행
npm run db:migrate

# 5. 테스트 데이터 시드
npm run db:seed

# 6. 개발 서버 시작
npm run dev
```

## 🎭 주요 명령어

### 개발

```bash
npm run dev          # 개발 서버 실행 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
```

### 품질 검사

```bash
npm run lint         # ESLint 검사
npm run typecheck    # TypeScript 타입 검사
npm run format       # Prettier 포매팅
npm run test         # 단위 테스트
npm run test:e2e     # E2E 테스트
npm run k6:smoke     # 성능 스모크 테스트
```

### 데이터베이스

```bash
npm run db:up        # Docker로 DB 실행
npm run db:down      # DB 종료
npm run db:migrate   # Prisma 마이그레이션
npm run db:studio    # Prisma Studio 실행
npm run db:seed      # 테스트 데이터 시드
```

### 운영 도구

```bash
npm run doctor       # 시스템 헬스 체크
npm run clean        # 빌드 아티팩트 정리
npm run headers:verify # 보안 헤더 검증
```

## 📁 프로젝트 구조

```
zzik-live/
├── app/                 # Next.js App Router
│   ├── (tabs)/         # 4-탭 네비게이션
│   ├── api/            # API 라우트
│   └── auth/           # 인증 페이지
├── components/          # React 컴포넌트
├── lib/                 # 유틸리티 함수
│   ├── server/         # 서버 유틸
│   ├── map/            # 지도 관련
│   └── analytics/      # 분석 도구
├── prisma/              # DB 스키마
├── tests/               # 테스트 코드
└── scripts/             # 운영 스크립트
```

## 🔒 보안 및 프라이버시

### 보안 헤더

- X-Frame-Options: DENY
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy

### 프라이버시 가드

- 로그/이벤트: geohash5만 허용 (원시 좌표 금지)
- 위치 정보: 미션 수행 중에만 수집, 완료 즉시 파기
- 파트너 공유: 닉네임/방문 시각만 (전화/정밀좌표 불가)

## 🎯 성능 목표

| 카테고리   | 목표    |
| ---------- | ------- |
| API p95    | ≤ 150ms |
| Search p95 | ≤ 80ms  |
| Wallet p95 | ≤ 100ms |
| 오류율     | < 0.3%  |
| Crash-free | ≥ 99.8% |

## 📝 운영 체크리스트

### 데일리

- [ ] Dev 서버 1개만 실행, 콘솔 에러 0
- [ ] DQ 뷰 확인: missing/dup/lag 임계 내
- [ ] 에러율/Latency 가드레일 이하
- [ ] 로그 샘플 점검: 원시 좌표 미포함(geohash5만)

### 릴리즈 전

- [ ] Lint/Typecheck/Unit/E2E/k6 통과
- [ ] Security headers 검증 통과
- [ ] 마이그레이션/시드 dry-run
- [ ] 롤백 플랜 문서 링크 첨부

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 참고 문서

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Mapbox Documentation](https://docs.mapbox.com/)

## 📄 라이센스

Proprietary - ZZIK LIVE © 2024

---

**📧 Contact**: dev@zzik.live  
**🌐 Website**: [https://zzik.live](https://zzik.live)

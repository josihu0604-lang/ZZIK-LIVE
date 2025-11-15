# CHECKLIST — Warroom Stabilize (Login/Splash/Guest/Privacy)

## 백업 및 브랜치 준비
- [x] backup-main-* tag + tar backup
- [x] fix/warroom-stabilize branch ready

## 서버 유틸 선별 반영
- [x] server utils (idempotency/rate-limit/logger) only
- [x] middleware protected APIs -> 401 unauth

## UI/UX 기준선
- [x] Splash page 가져옴
- [x] Login page 가져옴
- [x] AuthGate 컴포넌트 가져옴
- [x] BottomTabBar 컴포넌트 가져옴

## 접근성 및 프라이버시
- [ ] Axe serious/critical = 0 (테스트 준비됨)
- [ ] grep raw lat/lng (non-geohash) = 0
- [ ] ESLint privacy rules 적용

## 빌드 및 테스트
- [ ] npm ci 완료
- [ ] npm run build 성공
- [ ] Playwright 테스트 통과
- [ ] TypeScript 타입 체크 통과

## PR 준비
- [ ] 모든 변경사항 커밋
- [ ] PR 생성 및 링크 공유
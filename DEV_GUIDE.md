# ZZIK LIVE - 개발 서버 관리 가이드

## 🚀 개발 서버 실행 방법

### 1. 기본 실행 (권장)

```bash
npm run dev:monitor
```

이 명령어는:
- ✅ 자동으로 포트 충돌 해결
- ✅ 오류 발생 시 자동 재시작
- ✅ 실시간 오류 모니터링
- ✅ 로그 파일에 모든 활동 기록

### 2. PM2를 사용한 실행 (프로덕션에 가까운 환경)

```bash
# PM2 설치 (처음 한 번만)
npm install -g pm2

# 서버 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 보기
pm2 logs zzik-live-dev

# 재시작
pm2 restart zzik-live-dev

# 중지
pm2 stop zzik-live-dev

# 삭제
pm2 delete zzik-live-dev
```

### 3. 일반 실행

```bash
npm run dev
```

---

## 🏥 서버 상태 체크

### Health Check 실행

```bash
npm run health
```

체크 항목:
- 🔌 포트 상태
- 🌐 HTTP 응답
- ⏱️ 응답 시간
- 💾 메모리 사용량
- 📋 최근 오류
- 📄 로그 파일 크기

---

## 🔍 오류 분석

### 자동 오류 분석

```bash
npm run errors
```

분석 내용:
1. 오류 타입별 통계
2. 가장 빈번한 오류 Top 5
3. 최근 오류 타임라인
4. 자동 수정 가능한 문제 식별
5. 권장 조치 사항

---

## 🔧 자동 수정

### 1. 전체 수정 (추천)

```bash
npm run fix:all
```

실행 내용:
- 포트 정리
- 캐시 정리
- 의존성 재설치
- TypeScript 설정 재생성
- 로그 정리

### 2. 개별 수정

```bash
# 의존성 문제 수정
npm run fix:deps

# 캐시 문제 수정
npm run fix:cache

# 포트 충돌 수정
npm run fix:port

# TypeScript 문제 수정
npm run fix:types

# 로그 정리
npm run logs:clean
```

---

## 📊 로그 관리

### 로그 파일 위치

```
logs/
├── dev-server.log      # 개발 서버 일반 로그
├── dev-errors.log      # 오류만 모은 로그
├── error-analysis.txt  # 오류 분석 결과
├── pm2-out.log        # PM2 출력 로그
└── pm2-error.log      # PM2 오류 로그
```

### 로그 보기

```bash
# 실시간 로그 보기
tail -f logs/dev-server.log

# 오류만 보기
tail -f logs/dev-errors.log

# PM2 로그
pm2 logs
```

### 로그 정리

```bash
npm run logs:clean
```

---

## ⚠️ 자주 발생하는 문제와 해결

### 1. "Port 3000 is already in use"

**증상**: 포트가 이미 사용 중이라는 오류

**해결**:
```bash
npm run fix:port
```

또는 수동으로:
```bash
npx kill-port 3000
```

---

### 2. "Cannot find module"

**증상**: 모듈을 찾을 수 없다는 오류

**해결**:
```bash
npm run fix:deps
```

또는 수동으로:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 3. TypeScript 오류

**증상**: 타입 관련 오류

**해결**:
```bash
npm run fix:types
```

또는 타입 체크:
```bash
npm run build
```

---

### 4. 캐시 문제

**증상**: 변경사항이 반영되지 않음

**해결**:
```bash
npm run fix:cache
```

또는 수동으로:
```bash
rm -rf .next
```

---

### 5. Hydration 오류

**증상**: 서버/클라이언트 렌더링 불일치

**해결 방법**:
1. `'use client'` 지시어 확인
2. 서버 컴포넌트에서 브라우저 API 사용 확인
3. 동적 import 사용 고려

```tsx
// 잘못된 예
export default function Component() {
  const data = localStorage.getItem('key'); // ❌
  return <div>{data}</div>;
}

// 올바른 예
'use client';
import { useEffect, useState } from 'react';

export default function Component() {
  const [data, setData] = useState('');
  
  useEffect(() => {
    setData(localStorage.getItem('key') || ''); // ✅
  }, []);
  
  return <div>{data}</div>;
}
```

---

### 6. 메모리 부족

**증상**: 서버가 느려지거나 중단됨

**해결**:
```bash
# PM2 재시작
pm2 restart zzik-live-dev

# 또는 메모리 제한 증가
pm2 start ecosystem.config.js --max-memory-restart 1G
```

---

## 🎯 개발 워크플로우

### 매일 시작할 때

```bash
# 1. 저장소 업데이트
git pull

# 2. 의존성 확인
npm install

# 3. 서버 시작
npm run dev:monitor

# 4. 상태 체크
npm run health
```

### 문제가 생겼을 때

```bash
# 1. 오류 분석
npm run errors

# 2. 자동 수정 시도
npm run fix:all

# 3. 서버 재시작
npm run dev:monitor
```

### 커밋하기 전

```bash
# 1. 타입 체크
npm run build

# 2. 린트 체크
npm run lint

# 3. 로그 정리
npm run logs:clean
```

---

## 🔄 자동 재시작 설정

### 개발 서버 모니터 사용 시

자동으로 다음 상황에서 재시작:
- 치명적 오류 발생
- 서버 크래시
- 포트 충돌
- 최대 5회 재시도

### PM2 사용 시

자동으로 다음 상황에서 재시작:
- 프로세스 크래시
- 메모리 500MB 초과
- 오류 발생
- 최대 10회 재시도

---

## 📈 성능 모니터링

### 실시간 모니터링

```bash
# Health check
npm run health

# PM2 모니터링
pm2 monit
```

### 지표 확인

```bash
# 메모리 사용량
pm2 info zzik-live-dev

# CPU 사용량
top -p $(pgrep -f "next dev")
```

---

## 🛡️ 안전 장치

### 1. 자동 포트 정리
- 시작 시 자동으로 포트 3000 확인
- 사용 중이면 자동 종료 후 시작

### 2. 오류 로깅
- 모든 오류를 별도 파일에 기록
- 패턴 분석으로 반복 오류 감지

### 3. 자동 재시작
- 치명적 오류 시 자동 재시작
- 재시도 횟수 제한으로 무한 루프 방지

### 4. 로그 로테이션
- 로그 파일 크기 모니터링
- 자동 압축 및 아카이빙

---

## 🆘 긴급 복구

모든 것이 실패했을 때:

```bash
# 1. 모든 Node 프로세스 종료
pkill -f node

# 2. 포트 강제 정리
npx kill-port 3000

# 3. 전체 정리
npm run fix:all

# 4. 재시작
npm run dev:monitor
```

---

## 📞 추가 도움

### 로그 확인
모든 활동은 `logs/` 디렉토리에 기록됩니다.

### 스크립트 위치
모든 관리 스크립트는 `scripts/` 디렉토리에 있습니다.

### 커스터마이징
`ecosystem.config.js`에서 PM2 설정을 조정할 수 있습니다.

---

## 💡 팁

1. **항상 모니터 모드로 실행**
   ```bash
   npm run dev:monitor
   ```

2. **정기적으로 상태 체크**
   ```bash
   npm run health
   ```

3. **문제가 반복되면 로그 분석**
   ```bash
   npm run errors
   ```

4. **주기적으로 캐시 정리**
   ```bash
   npm run fix:cache
   ```

5. **PM2로 백그라운드 실행**
   ```bash
   pm2 start ecosystem.config.js
   ```

---

## 🎓 베스트 프랙티스

### DO ✅
- 항상 `npm run dev:monitor` 사용
- 정기적으로 health check 실행
- 오류 발생 시 즉시 분석
- 로그 파일 주기적 정리
- Git commit 전 타입 체크

### DON'T ❌
- 여러 개의 개발 서버 동시 실행
- 로그 파일 무시
- 캐시 문제 방치
- 오류 메시지 무시
- 의존성 업데이트 후 테스트 생략

---

**🚀 Happy Coding!**

모든 스크립트는 자동화되어 있으니 편하게 개발에 집중하세요!

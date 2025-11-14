# 머지 전 검증 체크리스트

이 문서는 PR #1을 머지하기 전에 반드시 확인해야 할 사항들을 정리합니다.

## ✅ 필수 검증 항목

### 1. 환경 설정
```bash
# 데이터베이스 및 Redis 실행
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zzik
export REDIS_URL=redis://localhost:6379

# 마이그레이션 실행
npm run db:migrate

# 테스트 데이터 시드
psql "$DATABASE_URL" -f scripts/seed-mini.sql
psql "$DATABASE_URL" -f scripts/seed-verify.sql

# 개발 서버 시작
npm run dev
```

### 2. 헤더 및 레이트리밋 검증
```bash
./scripts/verify-response-headers.sh
```

**기대 결과**:
- ✅ X-Request-Id: present
- ✅ X-RateLimit-Limit: present
- ✅ X-RateLimit-Remaining: present
- ✅ X-RateLimit-Reset: present
- ✅ X-Verification-State: present
- ✅ X-Idempotent-Replay: present
- ✅ Server-Timing: present
- ✅ Response body has 'status' field
- ✅ Returns 422 without Idempotency-Key
- ✅ All checks passed (exit code 0)

### 3. 성능 검증 (k6)
```bash
k6 run k6/qr-smoke.js -e BASE_URL=http://localhost:3000
```

**기대 결과**:
```
✓ http_req_duration{endpoint:qr_verify} p(95) < 800ms
✓ http_req_failed{endpoint:qr_verify} rate < 1%
✓ All checks passed
```

### 4. 수동 엔드포인트 검증

#### 4.1 QR 검증 (멱등성 키 필수)
```bash
# 첫 번째 요청
curl -i -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-qr-001' \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}'
```

**기대**:
- HTTP 200 OK
- `X-Idempotent-Replay: 0` (첫 실행)
- `X-Verification-State: ok|expired|used|invalid`
- `{"status":"ok|expired|used|invalid"}`

```bash
# 동일 키로 재요청 (멱등성 테스트)
curl -i -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-qr-001' \
  -d '{"token":"different-token","placeId":"p2","locGeohash5":"abcde"}'
```

**기대**:
- HTTP 200 OK
- `X-Idempotent-Replay: 1` (재생됨)
- 첫 번째 요청과 동일한 응답 body

#### 4.2 멱등성 키 누락 검증
```bash
curl -i -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}'
```

**기대**:
- HTTP 422 Unprocessable Entity
- `{"error":"IDEMPOTENCY_KEY_REQUIRED"}`

#### 4.3 GPS 검증
```bash
curl -i -X POST http://localhost:3000/api/verify/location \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","userGeohash5":"wydm6","ts":'$(date +%s000)'}'
```

**기대**:
- HTTP 200 OK
- `{"gpsOk":true|false,"distanceMeters":<number>}`
- `X-RateLimit-*` 헤더 존재

#### 4.4 영수증 업로드
```bash
curl -i -X POST http://localhost:3000/api/receipts/upload \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","amount":25000,"fileKey":"test-receipt-001.jpg"}'
```

**기대**:
- HTTP 201 Created
- `{"receiptId":"<id>","ocrStatus":"pending"}`

#### 4.5 영수증 OCR
```bash
# 먼저 receiptId를 위 업로드에서 받은 ID로 교체
curl -i -X POST http://localhost:3000/api/receipts/ocr \
  -H 'Content-Type: application/json' \
  -d '{"receiptId":"<receipt-id>","ok":true}'
```

**기대**:
- HTTP 200 OK
- `{"ocrStatus":"ok"}`

#### 4.6 통합 검증 판정
```bash
curl -i -X POST http://localhost:3000/api/verify/complete \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1"}'
```

**기대**:
- HTTP 200 OK
- `{"allowed":true|false,"gpsOk":true|false,"qrOk":true|false,"receiptOk":true|false}`
- `allowed = gpsOk && (qrOk || receiptOk)` 정책 준수

### 5. 4상태 QR 검증 테스트

#### 5.1 Invalid (존재하지 않는 토큰)
```bash
curl -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-invalid' \
  -d '{"token":"nonexistent-token","placeId":"p1","locGeohash5":"wydm6"}' | jq .
```
**기대**: `{"status":"invalid"}`

#### 5.2 Used (이미 사용된 토큰)
```bash
# q2는 seed 데이터에서 status='used'
curl -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-used' \
  -d '{"token":"already-used-token","placeId":"p2","locGeohash5":"wydm6"}' | jq .
```
**기대**: `{"status":"used"}`

#### 5.3 Expired (TTL 초과)
만료된 토큰을 시드 데이터에 추가하거나, TTL을 짧게 설정하여 테스트

#### 5.4 OK (성공)
```bash
curl -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-ok-'$(date +%s) \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}' | jq .
```
**기대**: `{"status":"ok"}` (첫 사용)

### 6. 레이트리밋 검증
```bash
# 61개 요청을 빠르게 전송하여 레이트리밋 테스트
for i in {1..61}; do
  curl -s -X POST http://localhost:3000/api/qr/verify \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: rate-test-$i" \
    -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}' \
    -w "\n%{http_code}\n" &
done
wait
```

**기대**:
- 처음 60개: HTTP 200
- 61번째 이후: HTTP 429 Too Many Requests
- 응답에 `Retry-After` 헤더 포함

### 7. 프라이버시 검증
```bash
# 로그에서 원시 좌표 검색 (있으면 안 됨)
npm run dev 2>&1 | tee dev.log &
sleep 5

# API 호출 후 로그 확인
curl -X POST http://localhost:3000/api/verify/location \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","userGeohash5":"wydm6"}' > /dev/null

# 원시 좌표 패턴 검색
grep -E "(latitude|longitude|lat|lng|coord).*[0-9]+\.[0-9]+" dev.log
```

**기대**: 매치 없음 (geohash5만 로그에 기록)

### 8. LABS 플래그 검증
```bash
# Feed 기본 비활성 확인
curl -s http://localhost:3000/feed | grep -q "redirect" && echo "✅ Feed redirected" || echo "❌ Feed accessible"
```

**기대**: Feed는 기본적으로 리다이렉트되어야 함

## 🚨 CI 연결 (필수)

### GitHub Actions 설정
1. `.github/workflows/verify-pr.yml` 파일을 main 브랜치에 추가
2. Repository Settings → Actions → General → Allow all actions 확인
3. Repository Secrets 추가:
   - `DATABASE_URL`
   - `REDIS_URL`
   - (선택) `MAPBOX_TOKEN`

### 브랜치 보호 규칙
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Require status checks: `verify-pr`
4. Require branches to be up to date

### CI 워크플로우 수동 추가 방법
상세 내용은 `CI_SETUP_INSTRUCTIONS.md` 참조

## 📊 머지 준비 완료 체크리스트

- [ ] 모든 헤더 검증 통과 (`./scripts/verify-response-headers.sh`)
- [ ] k6 성능 테스트 통과 (p95 < 800ms)
- [ ] 4상태 QR 검증 동작 확인
- [ ] 멱등성 재생 검증 통과
- [ ] 레이트리밋 동작 확인 (429 응답)
- [ ] GPS 검증 거리 계산 정확성 확인
- [ ] 통합 판정 정책 준수 (GPS && (QR || Receipt))
- [ ] 프라이버시 가드 확인 (geohash5만 로그)
- [ ] LABS 플래그 동작 확인 (Feed 기본 비활성)
- [ ] CI 워크플로우 추가 및 통과
- [ ] 브랜치 보호 규칙 설정

## ⚠️ 알려진 제한사항

1. **세션 통합**: `userId='current'` 스텁 사용 중
   - NextAuth 통합 전까지 `REQUIRE_AUTH_FOR_VERIFY=false` 유지
   
2. **OCR 구현**: 스텁 구현
   - 실제 OCR 서비스 연동 전까지 영수증 검증 비활성 권장
   
3. **Feed 접근**: LABS 플래그로 제어됨
   - `NEXT_PUBLIC_ENABLE_FEED=false` (기본값)

## 🎯 다음 단계

머지 후 우선순위:
1. Wallet 리딤 멱등성 구현
2. a11y 회귀 0 보장 (CI 필수 체크)
3. 로그 프라이버시 가드 ESLint 규칙 추가
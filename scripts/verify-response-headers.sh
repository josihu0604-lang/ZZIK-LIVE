#!/bin/bash
# Verify that verification API endpoints return required headers

BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILED=0

echo "🔍 Verifying Response Headers for Verification APIs"
echo "===================================================="

# Test QR Verification endpoint headers
echo -e "\n1️⃣ Testing /api/qr/verify headers..."
RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/qr/verify" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}' 2>&1)

# Check required headers
HEADERS_TO_CHECK=(
  "X-Request-Id"
  "X-RateLimit-Limit"
  "X-RateLimit-Remaining"
  "X-RateLimit-Reset"
  "X-Verification-State"
  "X-Idempotent-Replay"
  "Server-Timing"
)

for header in "${HEADERS_TO_CHECK[@]}"; do
  if echo "$RESPONSE" | grep -qi "$header"; then
    echo "  ✅ $header: present"
  else
    echo "  ❌ $header: MISSING"
    FAILED=$((FAILED + 1))
  fi
done

# Check response body has status field
if echo "$RESPONSE" | grep -q '"status"'; then
  echo "  ✅ Response body has 'status' field"
else
  echo "  ❌ Response body missing 'status' field"
  FAILED=$((FAILED + 1))
fi

# Test idempotency key requirement
echo -e "\n2️⃣ Testing idempotency key requirement..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/qr/verify" \
  -H 'Content-Type: application/json' \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "422" ]; then
  echo "  ✅ Returns 422 without Idempotency-Key"
else
  echo "  ❌ Expected 422, got $HTTP_CODE"
  FAILED=$((FAILED + 1))
fi

if echo "$RESPONSE" | grep -q "IDEMPOTENCY_KEY_REQUIRED"; then
  echo "  ✅ Error message is correct"
else
  echo "  ❌ Error message missing or incorrect"
  FAILED=$((FAILED + 1))
fi

# Test Location Verification headers
echo -e "\n3️⃣ Testing /api/verify/location headers..."
RESPONSE=$(curl -s -i -X POST "$BASE_URL/api/verify/location" \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","userGeohash5":"wydm6"}' 2>&1)

LOCATION_HEADERS=(
  "X-RateLimit-Limit"
  "X-RateLimit-Remaining"
  "X-RateLimit-Reset"
)

for header in "${LOCATION_HEADERS[@]}"; do
  if echo "$RESPONSE" | grep -qi "$header"; then
    echo "  ✅ $header: present"
  else
    echo "  ❌ $header: MISSING"
    FAILED=$((FAILED + 1))
  fi
done

# Check response body has required fields
if echo "$RESPONSE" | grep -q '"gpsOk"' && echo "$RESPONSE" | grep -q '"distanceMeters"'; then
  echo "  ✅ Response has 'gpsOk' and 'distanceMeters' fields"
else
  echo "  ❌ Response missing required fields"
  FAILED=$((FAILED + 1))
fi

# Test Complete Verification endpoint
echo -e "\n4️⃣ Testing /api/verify/complete response..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/verify/complete" \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1"}')

REQUIRED_FIELDS=("allowed" "gpsOk" "qrOk" "receiptOk")
for field in "${REQUIRED_FIELDS[@]}"; do
  if echo "$RESPONSE" | grep -q "\"$field\""; then
    echo "  ✅ Field '$field': present"
  else
    echo "  ❌ Field '$field': MISSING"
    FAILED=$((FAILED + 1))
  fi
done

# Summary
echo -e "\n📊 Summary"
echo "==========="
if [ $FAILED -eq 0 ]; then
  echo "✅ All header and response checks passed!"
  exit 0
else
  echo "❌ $FAILED check(s) failed"
  exit 1
fi
#!/bin/bash
# ZZIK LIVE - API Smoke Test
# Tests 7 core routes with real DB data
# Performance targets: All p95 ≤ 150ms (except QR ≤ 800ms)

set -e

# Configuration
BASE_URL="${API_URL:-http://localhost:3000}"
TEST_USER_ID="user_creator_1"
TEST_PLACE_LAT="37.4979"  # Gangnam Cafe
TEST_PLACE_LNG="127.0276"
TEST_QR_CODE="a3b8c9d1e2f34567890abcdef1234567890abcdef1234567890abcdef123456"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

echo "========================================"
echo "ZZIK LIVE - API Smoke Test"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Test User: $TEST_USER_ID"
echo ""

# Helper function to test API route
test_route() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local max_duration_ms=$6
  
  TOTAL=$((TOTAL + 1))
  
  echo -n "Testing: $name ... "
  
  # Make request and measure time
  start=$(date +%s%N)
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X GET "$BASE_URL$endpoint" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  fi
  
  end=$(date +%s%N)
  
  # Parse response
  body=$(echo "$response" | head -n -2)
  status_code=$(echo "$response" | tail -n 2 | head -n 1)
  time_total=$(echo "$response" | tail -n 1)
  
  # Convert time to milliseconds (without bc)
  duration_ms=$(awk "BEGIN {printf \"%d\", $time_total * 1000}")
  
  # Check status code
  if [ "$status_code" != "$expected_status" ]; then
    echo -e "${RED}FAIL${NC} (Expected $expected_status, got $status_code)"
    echo "  Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    FAILED=$((FAILED + 1))
    return
  fi
  
  # Check duration
  if [ "$duration_ms" -gt "$max_duration_ms" ]; then
    echo -e "${YELLOW}SLOW${NC} ($duration_ms ms > $max_duration_ms ms target)"
    PASSED=$((PASSED + 1))
    return
  fi
  
  echo -e "${GREEN}PASS${NC} (${duration_ms}ms)"
  PASSED=$((PASSED + 1))
}

# Test 1: Places Nearby (PostGIS)
test_route \
  "Places Nearby" \
  "GET" \
  "/api/places/nearby?lat=$TEST_PLACE_LAT&lng=$TEST_PLACE_LNG&radius=1000&limit=10" \
  "" \
  "200" \
  "100"

# Test 2: Offers List
test_route \
  "Offers List" \
  "GET" \
  "/api/offers?userId=$TEST_USER_ID&limit=10" \
  "" \
  "200" \
  "150"

# Test 3: QR Verification (SUCCESS case - will fail if already scanned)
test_route \
  "QR Verify" \
  "POST" \
  "/api/qr/verify" \
  "{\"code\":\"$TEST_QR_CODE\",\"userId\":\"$TEST_USER_ID\",\"lat\":$TEST_PLACE_LAT,\"lng\":$TEST_PLACE_LNG}" \
  "200" \
  "800"

# Test 4: Wallet Summary
test_route \
  "Wallet Summary" \
  "GET" \
  "/api/wallet/summary?userId=$TEST_USER_ID" \
  "" \
  "200" \
  "100"

# Test 5: Vouchers List
test_route \
  "Vouchers List" \
  "GET" \
  "/api/vouchers?userId=$TEST_USER_ID&status=ACTIVE&limit=10" \
  "" \
  "200" \
  "100"

# Test 6: Analytics Event
test_route \
  "Analytics Event" \
  "POST" \
  "/api/analytics" \
  "{\"name\":\"test_event\",\"properties\":{\"source\":\"smoke_test\"}}" \
  "200" \
  "100"

# Test 7: Me (Auth)
test_route \
  "Me (Auth)" \
  "GET" \
  "/api/me" \
  "" \
  "401" \
  "50"

echo ""
echo "========================================"
echo "Results:"
echo "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAILED${NC}"
fi
echo "========================================"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
fi

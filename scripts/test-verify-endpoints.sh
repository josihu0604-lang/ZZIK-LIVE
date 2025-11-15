#!/bin/bash
# Test script for verification endpoints

BASE_URL="${BASE_URL:-http://localhost:3000}"
IDEM_KEY="test-$(date +%s)"

echo "🔍 Testing Verification Endpoints..."
echo "================================="

# Test QR verification without idempotency key (should fail)
echo -e "\n1️⃣ Testing QR verify without Idempotency-Key (expect 422):"
curl -s -X POST "$BASE_URL/api/qr/verify" \
  -H 'Content-Type: application/json' \
  -d '{"token":"test","placeId":"p1","locGeohash5":"wydm6"}' \
  -w "\nStatus: %{http_code}\n"

# Test QR verification with idempotency key
echo -e "\n2️⃣ Testing QR verify with Idempotency-Key:"
curl -s -X POST "$BASE_URL/api/qr/verify" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"token":"123456","placeId":"p1","locGeohash5":"wydm6"}' \
  -w "\nStatus: %{http_code}\n" | jq '.'

# Test location verification
echo -e "\n3️⃣ Testing location verification:"
curl -s -X POST "$BASE_URL/api/verify/location" \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","userGeohash5":"wydm6"}' \
  -w "\nStatus: %{http_code}\n" | jq '.'

# Test receipt upload
echo -e "\n4️⃣ Testing receipt upload:"
curl -s -X POST "$BASE_URL/api/receipts/upload" \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1","amount":25000,"fileKey":"test-receipt.jpg"}' \
  -w "\nStatus: %{http_code}\n" | jq '.'

# Test complete verification
echo -e "\n5️⃣ Testing complete verification:"
curl -s -X POST "$BASE_URL/api/verify/complete" \
  -H 'Content-Type: application/json' \
  -d '{"placeId":"p1"}' \
  -w "\nStatus: %{http_code}\n" | jq '.'

echo -e "\n✅ Verification endpoint tests complete!"
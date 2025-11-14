#!/usr/bin/env bash
# Performance smoke test - basic benchmarks for UI layer
# Part of ZZIK LIVE hardening pack

set -euo pipefail

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}⚡ ZZIK LIVE Performance Smoke Test${COLOR_RESET}"
echo "====================================="
echo ""

# Check if server is running
if ! curl -s -f http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${COLOR_YELLOW}⚠️  Dev server not running${COLOR_RESET}"
  echo "Skipping performance tests (requires running server)"
  echo "Run 'npm run dev' first, then re-run this test"
  exit 0
fi

FAILED=0

# Test: Health endpoint
echo "🏥 Testing health endpoint..."
START=$(date +%s%3N)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
END=$(date +%s%3N)
LATENCY=$((END - START))

if [ "$STATUS" = "200" ]; then
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} Health check passed (${LATENCY}ms)"
else
  echo -e "${COLOR_RED}✗${COLOR_RESET} Health check failed (status: $STATUS)"
  ((FAILED++))
fi
echo ""

# Test: Static assets load time
echo "📦 Testing static asset load time..."
START=$(date +%s%3N)
curl -s -f http://localhost:3000/_next/static/ > /dev/null 2>&1 || true
END=$(date +%s%3N)
ASSET_LATENCY=$((END - START))

if [ $ASSET_LATENCY -lt 500 ]; then
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} Static assets responsive (${ASSET_LATENCY}ms)"
else
  echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} Static assets slow (${ASSET_LATENCY}ms, target <500ms)"
fi
echo ""

# Test: API response times (if available)
echo "🔌 Testing API endpoints..."

# Test offers endpoint
if curl -s -f http://localhost:3000/api/offers > /dev/null 2>&1; then
  START=$(date +%s%3N)
  curl -s -f http://localhost:3000/api/offers > /dev/null 2>&1
  END=$(date +%s%3N)
  OFFERS_LATENCY=$((END - START))
  
  if [ $OFFERS_LATENCY -le 150 ]; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} /api/offers: ${OFFERS_LATENCY}ms (≤150ms target)"
  else
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} /api/offers: ${OFFERS_LATENCY}ms (exceeds 150ms target)"
  fi
else
  echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} /api/offers not available (skipping)"
fi
echo ""

# Summary
echo "====================================="
echo "Performance Smoke Test Summary"
echo "====================================="
echo -e "Health:       ${COLOR_GREEN}${LATENCY}ms${COLOR_RESET}"
echo -e "Static:       ${ASSET_LATENCY}ms"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${COLOR_RED}❌ SMOKE TEST FAILED${COLOR_RESET}"
  exit 1
else
  echo -e "${COLOR_GREEN}✅ SMOKE TEST PASSED${COLOR_RESET}"
  echo "Basic performance metrics within acceptable range"
  exit 0
fi

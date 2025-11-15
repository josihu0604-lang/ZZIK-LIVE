#!/bin/bash

# Environment Variable Validation Script
# Checks for required environment variables before build/deployment

set -e

echo "🔐 Environment Variable Validation"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Required for production
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXT_PUBLIC_APP_URL"
)

# Optional but recommended
RECOMMENDED_VARS=(
  "REDIS_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_MAPBOX_TOKEN"
)

# Check required variables
echo "📋 Checking Required Variables..."
echo ""

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗ MISSING${NC} - $var (REQUIRED)"
    ERRORS=$((ERRORS + 1))
  else
    # Mask sensitive values
    value="${!var}"
    masked="${value:0:10}***${value: -5}"
    echo -e "${GREEN}✓ FOUND${NC} - $var = $masked"
  fi
done

echo ""
echo "📋 Checking Recommended Variables..."
echo ""

for var in "${RECOMMENDED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${YELLOW}⚠ MISSING${NC} - $var (optional, some features may not work)"
    WARNINGS=$((WARNINGS + 1))
  else
    value="${!var}"
    masked="${value:0:10}***${value: -5}"
    echo -e "${GREEN}✓ FOUND${NC} - $var = $masked"
  fi
done

echo ""
echo "==================================="
echo "📊 Summary"
echo "==================================="
echo -e "Errors:   ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}✗ Missing required environment variables!${NC}"
  echo ""
  echo "Please set the following in your .env.local file:"
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo "  $var=your_value_here"
    fi
  done
  echo ""
  exit 1
else
  echo -e "${GREEN}✓ All required environment variables are set!${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some optional variables are missing. Features may be limited.${NC}"
  fi
  exit 0
fi

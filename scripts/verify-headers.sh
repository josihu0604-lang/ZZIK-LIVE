#!/bin/bash

# Security Headers Verification Script
# Usage: ./scripts/verify-headers.sh [URL]

set -e

URL=${1:-"http://localhost:3000"}
FAILED=0

echo "🔒 Verifying Security Headers for: $URL"
echo "========================================="

# Function to check header
check_header() {
    local header_name=$1
    local expected_value=$2
    local actual_value=$(curl -sI "$URL" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r')
    
    if [ -z "$actual_value" ]; then
        echo "❌ $header_name: MISSING"
        FAILED=$((FAILED + 1))
    elif [ "$expected_value" != "*" ] && [ "$actual_value" != "$expected_value" ]; then
        echo "⚠️  $header_name: $actual_value (expected: $expected_value)"
        FAILED=$((FAILED + 1))
    else
        echo "✅ $header_name: $actual_value"
    fi
}

# Check required security headers
check_header "X-Frame-Options" "DENY"
check_header "X-Content-Type-Options" "nosniff"
check_header "Strict-Transport-Security" "*"
check_header "Referrer-Policy" "strict-origin-when-cross-origin"
check_header "Cross-Origin-Opener-Policy" "same-origin"
check_header "Cross-Origin-Resource-Policy" "same-origin"
check_header "Cross-Origin-Embedder-Policy" "require-corp"
check_header "Permissions-Policy" "*"
check_header "Content-Security-Policy" "*"
check_header "X-DNS-Prefetch-Control" "off"
check_header "Origin-Agent-Cluster" "?1"

echo "========================================="

# Check CSP directives
echo ""
echo "📋 Content Security Policy Analysis:"
CSP=$(curl -sI "$URL" | grep -i "^Content-Security-Policy:" | cut -d' ' -f2- | tr -d '\r')
if [ ! -z "$CSP" ]; then
    if echo "$CSP" | grep -q "default-src 'self'"; then
        echo "✅ default-src properly restricted"
    else
        echo "⚠️  default-src not properly restricted"
        FAILED=$((FAILED + 1))
    fi
    
    if echo "$CSP" | grep -q "frame-ancestors 'none'"; then
        echo "✅ frame-ancestors prevents embedding"
    else
        echo "❌ frame-ancestors not set to 'none'"
        FAILED=$((FAILED + 1))
    fi
    
    if echo "$CSP" | grep -q "upgrade-insecure-requests"; then
        echo "✅ upgrade-insecure-requests enabled"
    else
        echo "⚠️  upgrade-insecure-requests not set"
    fi
fi

echo "========================================="

# Summary
if [ $FAILED -eq 0 ]; then
    echo "✅ All security headers verified successfully!"
    exit 0
else
    echo "❌ $FAILED security header issue(s) found"
    exit 1
fi
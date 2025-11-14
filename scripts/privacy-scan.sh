#!/bin/bash
# scripts/privacy-scan.sh
# Scans for raw coordinate usage (lat|lng|latitude|longitude)
# Blocks build if violations found outside _disabled folders

set -euo pipefail

echo "🔍 Scanning for raw coordinates (lat|lng|latitude|longitude)..."
echo ""

violations=0
total_matches=0

# Search for raw coordinate patterns in source files
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)
  
  # Skip _disabled directories
  if echo "$file" | grep -q "_disabled/"; then
    continue
  fi
  
  # Skip test files that intentionally test redaction
  if echo "$file" | grep -q "logger.spec.ts"; then
    continue
  fi
  
  # Skip this scanner script itself
  if echo "$file" | grep -q "privacy-scan.sh"; then
    continue
  fi
  
  total_matches=$((total_matches + 1))
  
  # Extract context (5 lines around match)
  context=$(awk "NR>=$linenum-2 && NR<=$linenum+2" "$file" 2>/dev/null || echo "")
  
  # Check if this is in an allowed context
  allowed=false
  
  # Allow if geohash conversion/encoding/decoding is present
  if echo "$context" | grep -qi "geohash\|encode\|decode\|REDACT"; then
    allowed=true
  fi
  
  # Allow if it's a sanitization/redaction function (logger, privacy, analytics)
  if echo "$file" | grep -qE "(logger|privacy|analytics)\.ts"; then
    if echo "$context" | grep -qE "(sanitize|delete|REDACT|banned|prohibited)"; then
      allowed=true
    fi
  fi
  
  # Allow if it's internal geohash library implementation
  if echo "$file" | grep -qE "lib/(geohash|map/geohash|search/geo|privacy)\.ts"; then
    if echo "$context" | grep -qE "(Range|decode|encode|bounds|toRad|Haversine|function|export function|sanitize)"; then
      allowed=true
    fi
  fi
  
  # Allow if it's type definition with explicit 'never' type (prohibited types)
  if echo "$context" | grep -q "never;"; then
    allowed=true
  fi
  
  # Allow if it's clustering internal (Feature geometry)
  if echo "$file" | grep -q "clustering\.ts"; then
    if echo "$context" | grep -qE "(coordinates|Feature|geometry)"; then
      allowed=true
    fi
  fi
  
  # Allow if it's a server-side SQL parameter with explicit comment
  if echo "$context" | grep -q "Server-side only"; then
    allowed=true
  fi
  
  # Allow if it's in a banned keywords array/list (redaction lists)
  if echo "$context" | grep -qE "(const banned|REDACT_KEYS|'(lat|lng|latitude|longitude)',)"; then
    allowed=true
  fi
  
  # Allow if it's a regex pattern for detection or 'in' operator check
  if echo "$context" | grep -qE "(test\\(|\\/(\\\\b)?\\(lat\\|lng|'(lat|lng|latitude|longitude)' in )"; then
    allowed=true
  fi
  
  # Allow TypeScript interface/type with 'number' type
  if echo "$context" | grep -qE "(interface|type|\\}: \\{).*\\{"; then
    if echo "$context" | grep -q "number"; then
      allowed=true
    fi
  fi
  
  # Allow if it's a return type annotation (: { ... })
  if echo "$context" | grep -qE ": \\{|\\[number, number\\]"; then
    allowed=true
  fi
  
  if [ "$allowed" = true ]; then
    echo "✓ ALLOWED: $file:$linenum"
  else
    echo "❌ VIOLATION: $file:$linenum"
    echo "   Context:"
    echo "$context" | sed 's/^/   │ /'
    echo ""
    violations=$((violations + 1))
  fi
done < <(grep -RInE "\b(lat|lng|latitude|longitude)\b" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  app components lib 2>/dev/null || true)

echo ""
echo "========================================="
echo "Privacy Scan Results"
echo "========================================="
echo "Total matches: $total_matches"
echo "Violations: $violations"
echo "========================================="
echo ""

if [ $violations -gt 0 ]; then
  echo "❌ Privacy scan FAILED: $violations violation(s) found"
  echo ""
  echo "Raw coordinates (lat/lng/latitude/longitude) are prohibited."
  echo "Use geohash5 encoding instead and ensure proper conversion context."
  echo ""
  exit 1
fi

echo "✅ Privacy scan PASSED: No violations found"
exit 0

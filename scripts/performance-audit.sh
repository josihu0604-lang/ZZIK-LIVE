#!/bin/bash

# Performance Audit Script
# Analyzes bundle size, dependencies, and performance metrics

set -e

echo "⚡ Performance Audit"
echo "==================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Bundle size analysis
echo "📦 Analyzing Bundle Sizes..."
echo ""

if [ -d ".next/static" ]; then
  echo "Client-side JavaScript:"
  find .next/static -name "*.js" -type f ! -name "*.map" -exec du -h {} + | sort -rh | head -10
  echo ""
  
  total_js=$(find .next/static -name "*.js" -type f ! -name "*.map" -exec du -b {} + | awk '{sum+=$1} END {print sum}')
  total_js_mb=$(awk "BEGIN {printf \"%.2f\", $total_js / 1048576}")
  echo -e "Total JS size: ${total_js_mb}MB"
  
  if awk "BEGIN {exit !($total_js_mb > 5.0)}"; then
    echo -e "${RED}⚠️  Warning: Large bundle size (>5MB)${NC}"
  else
    echo -e "${GREEN}✓ Bundle size is reasonable${NC}"
  fi
  echo ""
else
  echo -e "${YELLOW}⚠️  .next/static not found. Run 'npm run build' first.${NC}"
  echo ""
fi

# 2. Check for large dependencies
echo "📚 Checking Large Dependencies..."
echo ""

if command -v npm &> /dev/null; then
  echo "Top 10 largest packages:"
  npm list --all --parseable 2>/dev/null | xargs du -s 2>/dev/null | sort -rh | head -10 | while read size path; do
    package=$(basename "$path")
    size_kb=$(awk "BEGIN {printf \"%.0f\", $size / 1024}")
    
    if [ "$size_kb" -gt 1000 ]; then
      echo -e "${RED}  ${size_kb}KB - $package${NC}"
    elif [ "$size_kb" -gt 500 ]; then
      echo -e "${YELLOW}  ${size_kb}KB - $package${NC}"
    else
      echo -e "  ${size_kb}KB - $package"
    fi
  done
  echo ""
fi

# 3. Check for duplicate dependencies
echo "🔍 Checking for Duplicate Dependencies..."
echo ""

if command -v npm &> /dev/null; then
  duplicates=$(npm dedupe --dry-run 2>&1 || true)
  if [ -n "$duplicates" ]; then
    echo -e "${YELLOW}⚠️  Found potential duplicate dependencies${NC}"
    echo "$duplicates" | grep -E "npm dedupe" | head -5
  else
    echo -e "${GREEN}✓ No duplicate dependencies found${NC}"
  fi
  echo ""
fi

# 4. Count total dependencies
echo "📊 Dependency Statistics..."
echo ""

if [ -f "package.json" ]; then
  prod_deps=$(jq -r '.dependencies | length' package.json 2>/dev/null || echo "0")
  dev_deps=$(jq -r '.devDependencies | length' package.json 2>/dev/null || echo "0")
  total_deps=$((prod_deps + dev_deps))
  
  echo "Production dependencies: $prod_deps"
  echo "Development dependencies: $dev_deps"
  echo "Total: $total_deps"
  echo ""
  
  if [ "$total_deps" -gt 100 ]; then
    echo -e "${YELLOW}⚠️  High dependency count. Consider reducing.${NC}"
  else
    echo -e "${GREEN}✓ Dependency count is reasonable${NC}"
  fi
  echo ""
fi

# 5. Check for heavy packages
echo "🎯 Identifying Heavy Packages..."
echo ""

HEAVY_PACKAGES=("moment" "lodash" "axios" "date-fns" "rxjs")
found_heavy=0

for pkg in "${HEAVY_PACKAGES[@]}"; do
  if grep -q "\"$pkg\"" package.json 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Found heavy package: $pkg${NC}"
    echo "   Consider alternatives:"
    case $pkg in
      "moment")
        echo "   - date-fns or dayjs (lighter)"
        ;;
      "lodash")
        echo "   - lodash-es (tree-shakeable) or native methods"
        ;;
      "axios")
        echo "   - native fetch API"
        ;;
    esac
    found_heavy=1
  fi
done

if [ $found_heavy -eq 0 ]; then
  echo -e "${GREEN}✓ No known heavy packages found${NC}"
fi
echo ""

# 6. Check for code splitting
echo "🔪 Code Splitting Analysis..."
echo ""

if [ -d ".next" ]; then
  chunk_count=$(find .next -name "*.js" -type f ! -name "*.map" | wc -l)
  echo "Total JS chunks: $chunk_count"
  
  if [ "$chunk_count" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  Low chunk count. Consider more code splitting.${NC}"
  else
    echo -e "${GREEN}✓ Good code splitting${NC}"
  fi
  echo ""
fi

# Summary
echo "==================="
echo "📊 Performance Audit Complete"
echo "==================="
echo ""
echo "Recommendations:"
echo "1. Keep total bundle size under 5MB"
echo "2. Use dynamic imports for large components"
echo "3. Optimize images with next/image"
echo "4. Enable tree-shaking with ES modules"
echo "5. Use React.lazy for route-based code splitting"
echo ""

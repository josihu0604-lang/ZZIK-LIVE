#!/bin/bash

# 📊 Advanced Bundle Size Analysis Script
# Analyzes Next.js bundle composition and identifies optimization opportunities

set -e

echo "======================================"
echo "📊 BUNDLE SIZE ANALYSIS - Round 5"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Build the app
echo "1️⃣ Building production bundle..."
ANALYZE=true npm run build > build-output.log 2>&1

# 2. Analyze build output
echo ""
echo "2️⃣ Analyzing build statistics..."

if [ -f ".next/analyze/client.html" ]; then
  echo -e "${GREEN}✅ Bundle analyzer report generated: .next/analyze/client.html${NC}"
else
  echo -e "${YELLOW}⚠️  Bundle analyzer report not found${NC}"
fi

# 3. Extract bundle sizes from build output
echo ""
echo "3️⃣ Bundle Size Breakdown:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Parse .next/build-manifest.json for detailed info
if [ -f ".next/build-manifest.json" ]; then
  echo "Client-side JavaScript bundles:"
  
  # Count total JS files
  JS_COUNT=$(find .next/static -name "*.js" 2>/dev/null | wc -l)
  echo "  Total JS files: $JS_COUNT"
  
  # Calculate total size
  TOTAL_SIZE=$(du -sh .next/static/chunks 2>/dev/null | cut -f1)
  echo "  Total chunks size: $TOTAL_SIZE"
  
  # Find largest chunks
  echo ""
  echo "  Top 10 largest chunks:"
  find .next/static/chunks -name "*.js" -exec ls -lh {} \; 2>/dev/null | \
    awk '{print $5, $9}' | \
    sort -rh | \
    head -10 | \
    nl -w2 -s'. '
else
  echo -e "${YELLOW}⚠️  Build manifest not found${NC}"
fi

# 4. Check for common bloat sources
echo ""
echo "4️⃣ Checking for bundle bloat..."

# Check for moment.js (often adds unnecessary locales)
if grep -rq "moment" .next/static 2>/dev/null; then
  echo -e "${YELLOW}⚠️  moment.js detected - consider using date-fns or dayjs instead${NC}"
else
  echo -e "${GREEN}✅ No moment.js bloat${NC}"
fi

# Check for lodash (entire library vs individual functions)
if grep -rq "lodash" .next/static 2>/dev/null; then
  echo -e "${YELLOW}⚠️  lodash detected - ensure you're using individual imports${NC}"
else
  echo -e "${GREEN}✅ No lodash bloat${NC}"
fi

# Check for duplicate dependencies
echo ""
echo "5️⃣ Checking for duplicate dependencies..."
npm ls --depth=0 --json > deps.json 2>&1 || true

# Count dependencies
DEP_COUNT=$(cat package.json | jq '.dependencies | length')
DEV_DEP_COUNT=$(cat package.json | jq '.devDependencies | length')
echo "  Production dependencies: $DEP_COUNT"
echo "  Dev dependencies: $DEV_DEP_COUNT"

# 6. Analyze dynamic imports
echo ""
echo "6️⃣ Analyzing code splitting..."

DYNAMIC_IMPORTS=$(grep -r "import(" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  Dynamic imports found: $DYNAMIC_IMPORTS"

if [ "$DYNAMIC_IMPORTS" -lt 5 ]; then
  echo -e "${YELLOW}⚠️  Low usage of dynamic imports - consider lazy loading heavy components${NC}"
else
  echo -e "${GREEN}✅ Good use of code splitting${NC}"
fi

# 7. Check for tree-shaking opportunities
echo ""
echo "7️⃣ Checking tree-shaking effectiveness..."

# Look for barrel exports (index.ts files that re-export everything)
BARREL_FILES=$(find app/ components/ lib/ -name "index.ts" -o -name "index.tsx" 2>/dev/null | wc -l)
echo "  Barrel export files: $BARREL_FILES"

if [ "$BARREL_FILES" -gt 10 ]; then
  echo -e "${YELLOW}⚠️  Many barrel exports detected - these can prevent tree-shaking${NC}"
  echo -e "${YELLOW}   Consider importing from specific files instead${NC}"
fi

# 8. Analyze page-specific bundles
echo ""
echo "8️⃣ Page-specific bundle analysis..."

if [ -d ".next/static/chunks/pages" ]; then
  echo "  Page bundles:"
  find .next/static/chunks/pages -name "*.js" -exec ls -lh {} \; 2>/dev/null | \
    awk '{print $5, $9}' | \
    sort -rh | \
    head -5 | \
    nl -w2 -s'. '
fi

# 9. Check for source maps in production
echo ""
echo "9️⃣ Checking source map configuration..."

if [ -f ".next/static/chunks/main-app.js.map" ]; then
  echo -e "${YELLOW}⚠️  Source maps included in build - consider disabling for production${NC}"
else
  echo -e "${GREEN}✅ Source maps not included${NC}"
fi

# 10. Generate optimization recommendations
echo ""
echo "🔟 Optimization Recommendations:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > BUNDLE_OPTIMIZATION_REPORT.md << 'EOF'
# Bundle Optimization Report - Round 5

## Current State

### Bundle Sizes
- See `.next/analyze/client.html` for interactive visualization
- Check build output for detailed size breakdown

### Issues Found

#### High Priority
1. **Large Dependencies**: Review largest chunks and consider alternatives
2. **Limited Code Splitting**: More dynamic imports needed for heavy components
3. **Barrel Exports**: May prevent effective tree-shaking

#### Medium Priority
1. **Source Maps**: Consider disabling in production builds
2. **Duplicate Code**: Check for code duplication across chunks
3. **Unused Exports**: Remove dead code identified by ts-prune

### Optimization Strategies

#### 1. Dynamic Imports (Code Splitting)
```typescript
// Before (eager loading)
import HeavyComponent from './HeavyComponent';

// After (lazy loading)
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false, // if client-side only
});
```

#### 2. Optimize Third-Party Libraries
```typescript
// Before (imports entire library)
import _ from 'lodash';

// After (imports specific function)
import debounce from 'lodash/debounce';
```

#### 3. Use Next.js Image Optimization
```typescript
// Always use next/image instead of <img>
import Image from 'next/image';

<Image 
  src="/photo.jpg" 
  alt="Photo" 
  width={800} 
  height={600}
  loading="lazy"
/>
```

#### 4. Implement Route-based Code Splitting
- Next.js automatically splits code by route
- Use `app/` directory structure effectively
- Avoid shared heavy components in layout

#### 5. Analyze and Remove Unused Code
```bash
# Find unused exports
npm run analyze:dead

# Remove them systematically
```

#### 6. Configure Webpack for Better Tree-Shaking
```typescript
// next.config.ts
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
  }
  return config;
}
```

#### 7. Use Import Aliases Carefully
```typescript
// Avoid importing from barrel files
import { Button } from '@/components'; // BAD

// Import directly from component file
import { Button } from '@/components/Button'; // GOOD
```

### Action Plan

- [ ] Implement dynamic imports for heavy components (Mapbox, QR scanner)
- [ ] Replace moment.js with date-fns or dayjs
- [ ] Use specific lodash imports instead of full library
- [ ] Remove barrel exports or use direct imports
- [ ] Configure next.config.ts for better tree-shaking
- [ ] Disable source maps in production
- [ ] Run bundle analyzer before/after each optimization
- [ ] Set up bundle size CI checks

### Target Metrics

- **First Load JS**: < 200 KB (currently: check build output)
- **Total Bundle Size**: < 500 KB
- **Largest Chunk**: < 150 KB
- **Number of Chunks**: Optimize for < 20 total

### Monitoring

Add to CI/CD pipeline:
```bash
# Fail build if bundle size exceeds threshold
npm run analyze:size
```

### References

- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Import Cost VSCode Extension](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)

EOF

echo -e "${GREEN}✅ Optimization report generated: BUNDLE_OPTIMIZATION_REPORT.md${NC}"

# 11. Summary
echo ""
echo "======================================"
echo "📊 Analysis Complete!"
echo "======================================"
echo ""
echo "📄 Reports Generated:"
echo "  • .next/analyze/client.html - Interactive bundle visualization"
echo "  • BUNDLE_OPTIMIZATION_REPORT.md - Optimization recommendations"
echo "  • build-output.log - Full build log"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open .next/analyze/client.html in browser"
echo "  2. Review BUNDLE_OPTIMIZATION_REPORT.md"
echo "  3. Implement recommended optimizations"
echo "  4. Run 'npm run analyze:size' to check against limits"
echo ""

#!/bin/bash

# 🧹 Console.log Cleanup Script
# Removes or guards debug console.logs for production

set -e

echo "======================================"
echo "🧹 CONSOLE.LOG CLEANUP - Round 6"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find all console.log, console.warn, console.error calls
echo "1️⃣ Scanning for console statements..."

TOTAL_LOGS=$(grep -r "console\." app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l)
echo "   Found $TOTAL_LOGS console statements"

# Categorize console statements
echo ""
echo "2️⃣ Categorizing console statements..."

# console.log (should be removed or guarded)
CONSOLE_LOGS=$(grep -r "console\.log" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l || echo "0")
echo "   console.log: $CONSOLE_LOGS"

# console.error (keep, but should use logger)
CONSOLE_ERRORS=$(grep -r "console\.error" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l || echo "0")
echo "   console.error: $CONSOLE_ERRORS"

# console.warn (keep, but should use logger)
CONSOLE_WARNS=$(grep -r "console\.warn" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l || echo "0")
echo "   console.warn: $CONSOLE_WARNS"

# List files with console.log
echo ""
echo "3️⃣ Files with console.log (should be cleaned):"
grep -rl "console\.log" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | head -20 | while read file; do
  COUNT=$(grep "console\.log" "$file" | wc -l)
  echo "   $file ($COUNT occurrences)"
done

# Create detailed report
echo ""
echo "4️⃣ Generating detailed report..."

cat > CONSOLE_CLEANUP_REPORT.md << 'EOF'
# Console.log Cleanup Report

**Date**: $(date)
**Total Console Statements**: $TOTAL_LOGS

## Summary

- console.log: $CONSOLE_LOGS (should remove/guard)
- console.error: $CONSOLE_ERRORS (should use logger)
- console.warn: $CONSOLE_WARNS (should use logger)

## Detailed Findings

### console.log Occurrences

```
EOF

grep -rn "console\.log" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | head -50 >> CONSOLE_CLEANUP_REPORT.md || echo "None found" >> CONSOLE_CLEANUP_REPORT.md

cat >> CONSOLE_CLEANUP_REPORT.md << 'EOF'
```

### console.error Occurrences

```
EOF

grep -rn "console\.error" app/ components/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next" | head -20 >> CONSOLE_CLEANUP_REPORT.md || echo "None found" >> CONSOLE_CLEANUP_REPORT.md

cat >> CONSOLE_CLEANUP_REPORT.md << 'EOF'
```

## Recommendations

### 1. Remove Debug console.log

**Action**: Remove all development debug logs

```typescript
// BAD
console.log('Debug info:', data);

// GOOD (remove completely)
// (no code)
```

### 2. Guard Development Logs

**Action**: Wrap necessary logs with environment check

```typescript
// BAD
console.log('User data:', user);

// GOOD
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] User data:', user);
}
```

### 3. Use Structured Logger

**Action**: Replace console.error/warn with lib/server/logger

```typescript
// BAD
console.error('API error:', error);

// GOOD
import { log } from '@/lib/server/logger';
log('error', 'API error occurred', { error: error.message });
```

### 4. Remove Analytics Debug Logs

Many console.log calls in analytics context should be removed:
- Analytics event tracking
- API response logging
- State change logging

### 5. Keep Essential Error Logs

Some console.error calls are important:
- Unexpected errors in catch blocks
- Critical system failures
- Database connection errors

## Automated Cleanup

To automatically remove basic console.log statements:

```bash
# Use sed to comment out console.log lines
find app/ components/ lib/ -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i.bak 's/^(\s*)console\.log/\1\/\/ console.log/g' "$file"
done

# Review changes and remove .bak files
find . -name "*.bak" -delete
```

## Manual Review Required

The following console statements require manual review:
1. Sentry instrumentation console.warn calls (keep)
2. Error boundary console.error calls (keep)
3. Development-only debugging (guard with env check)
4. Performance logging (consider removing)

## Next Steps

- [ ] Remove all debug console.log statements
- [ ] Guard necessary dev logs with NODE_ENV check
- [ ] Replace console.error with logger
- [ ] Replace console.warn with logger
- [ ] Add ESLint rule to prevent future console usage
- [ ] Test that logging still works in development

EOF

echo -e "${GREEN}✅ Report generated: CONSOLE_CLEANUP_REPORT.md${NC}"

# ESLint rule recommendation
echo ""
echo "5️⃣ Adding ESLint rule to prevent future console usage..."

cat > .eslintrc.console.json << 'EOF'
{
  "rules": {
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
EOF

echo -e "${BLUE}ℹ️  Created .eslintrc.console.json (optional, can be merged into .eslintrc.json)${NC}"

# Summary
echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "📊 Statistics:"
echo "   Total console statements: $TOTAL_LOGS"
echo "   console.log: $CONSOLE_LOGS (should remove)"
echo "   console.error: $CONSOLE_ERRORS (use logger)"
echo "   console.warn: $CONSOLE_WARNS (use logger)"
echo ""
echo "📝 Next Steps:"
echo "   1. Review CONSOLE_CLEANUP_REPORT.md"
echo "   2. Remove debug console.log statements"
echo "   3. Guard necessary logs with NODE_ENV"
echo "   4. Replace console.error/warn with logger"
echo "   5. Add ESLint rule to prevent future usage"
echo ""
echo -e "${YELLOW}⚠️  Run manually to avoid breaking changes${NC}"
echo ""

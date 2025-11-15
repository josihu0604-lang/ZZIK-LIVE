#!/bin/bash

echo "🎨 UX/UI Accessibility Audit"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
WARNINGS=0

echo "📋 Checking UX/UI Standards..."
echo ""

# 1. Check for ARIA attributes
echo -n "Checking ARIA attributes... "
ARIA_COUNT=$(grep -r "aria-" app --include="*.tsx" | wc -l)
if [ "$ARIA_COUNT" -gt "20" ]; then
  echo -e "${GREEN}✓ GOOD${NC} ($ARIA_COUNT found)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ LOW${NC} ($ARIA_COUNT found)"
  WARNINGS=$((WARNINGS + 1))
fi

# 2. Check for role attributes
echo -n "Checking role attributes... "
ROLE_COUNT=$(grep -r "role=" app --include="*.tsx" | wc -l)
if [ "$ROLE_COUNT" -gt "10" ]; then
  echo -e "${GREEN}✓ GOOD${NC} ($ROLE_COUNT found)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ LOW${NC} ($ROLE_COUNT found)"
  WARNINGS=$((WARNINGS + 1))
fi

# 3. Check for semantic HTML
echo -n "Checking semantic HTML (main, header, nav, footer)... "
SEMANTIC_COUNT=$(grep -rE "<(main|header|nav|footer|section|article)" app --include="*.tsx" | wc -l)
if [ "$SEMANTIC_COUNT" -gt "15" ]; then
  echo -e "${GREEN}✓ GOOD${NC} ($SEMANTIC_COUNT found)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ MODERATE${NC} ($SEMANTIC_COUNT found)"
  WARNINGS=$((WARNINGS + 1))
fi

# 4. Check for alt text on images
echo -n "Checking img alt attributes... "
IMG_WITHOUT_ALT=$(grep -r "<img" app --include="*.tsx" | grep -v "alt=" | wc -l)
if [ "$IMG_WITHOUT_ALT" -eq "0" ]; then
  echo -e "${GREEN}✓ ALL HAVE ALT${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ MISSING${NC} ($IMG_WITHOUT_ALT without alt)"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. Check for button types (improved: single-line only)
echo -n "Checking button type attributes... "
BUTTONS_WITHOUT_TYPE=$(grep -rh "<button[^>]*>" app --include="*.tsx" | grep -v "type=" | wc -l)
if [ "$BUTTONS_WITHOUT_TYPE" -eq "0" ]; then
  echo -e "${GREEN}✓ ALL TYPED${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ MISSING${NC} ($BUTTONS_WITHOUT_TYPE without type)"
  WARNINGS=$((WARNINGS + 1))
fi

# 6. Check for label associations (includes ARIA labels - context-aware)
echo -n "Checking form labels... "
LABEL_COUNT=$(grep -r "<label" app --include="*.tsx" | wc -l)
# Count inputs with aria-label using before/after context
ARIA_LABEL_INPUT_COUNT=$(grep -rB5 -A10 "<input" app --include="*.tsx" | grep -c "aria-label=")
INPUT_COUNT=$(grep -r "<input" app --include="*.tsx" | wc -l)
TOTAL_LABELS=$((LABEL_COUNT + ARIA_LABEL_INPUT_COUNT))
if [ "$TOTAL_LABELS" -ge "$INPUT_COUNT" ]; then
  echo -e "${GREEN}✓ GOOD${NC} ($TOTAL_LABELS labels/aria-labels for $INPUT_COUNT inputs)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ INCOMPLETE${NC} ($TOTAL_LABELS labels/aria-labels for $INPUT_COUNT inputs)"
  WARNINGS=$((WARNINGS + 1))
fi

# 7. Check for focus-visible styles
echo -n "Checking focus-visible styles... "
FOCUS_COUNT=$(grep -r "focus-visible" app styles --include="*.tsx" --include="*.css" | wc -l)
if [ "$FOCUS_COUNT" -gt "5" ]; then
  echo -e "${GREEN}✓ IMPLEMENTED${NC} ($FOCUS_COUNT occurrences)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ LIMITED${NC} ($FOCUS_COUNT occurrences)"
  WARNINGS=$((WARNINGS + 1))
fi

# 8. Check for responsive design tokens
echo -n "Checking responsive breakpoints... "
RESPONSIVE_COUNT=$(grep -rE "@media|max-width|min-width" app styles --include="*.tsx" --include="*.css" | wc -l)
if [ "$RESPONSIVE_COUNT" -gt "10" ]; then
  echo -e "${GREEN}✓ RESPONSIVE${NC} ($RESPONSIVE_COUNT media queries)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ LIMITED${NC} ($RESPONSIVE_COUNT media queries)"
  WARNINGS=$((WARNINGS + 1))
fi

# 9. Check for skip links
echo -n "Checking skip to main content... "
SKIP_LINK=$(grep -r "skip" app --include="*.tsx" | grep -i "main\|content" | wc -l)
if [ "$SKIP_LINK" -gt "0" ]; then
  echo -e "${GREEN}✓ PRESENT${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ MISSING${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 10. Check for lang attribute
echo -n "Checking html lang attribute... "
LANG_ATTR=$(grep -r "lang=" app --include="*.tsx" | head -1)
if [ -n "$LANG_ATTR" ]; then
  echo -e "${GREEN}✓ PRESENT${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ MISSING${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "============================"
echo "📊 UX/UI Audit Summary"
echo "============================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$WARNINGS" -eq "0" ]; then
  echo -e "${GREEN}✓ Excellent UX/UI accessibility!${NC}"
else
  echo -e "${YELLOW}⚠ Some areas need improvement${NC}"
fi

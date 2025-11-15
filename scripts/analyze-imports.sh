#!/bin/bash

# Import Analysis Script
# Analyzes import statements to identify heavy dependencies

echo "📦 Import Analysis Report"
echo "=========================="
echo ""

echo "Finding large imports..."
echo ""

# Find files with many imports
echo "Top 10 files with most imports:"
for file in $(find app/ components/ lib/ -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  import_count=$(grep -c "^import" "$file" 2>/dev/null || echo "0")
  if [ "$import_count" -gt 0 ]; then
    echo "$import_count imports - $file"
  fi
done | sort -rn | head -10

echo ""
echo "=========================="
echo ""

# Find external dependencies being imported
echo "Most used external packages:"
grep -rh "from ['\"]" app/ components/ lib/ 2>/dev/null | \
  grep -v "from ['\"]\./" | \
  grep -v "from ['\"]@/" | \
  sed "s/.*from ['\"]//g" | \
  sed "s/['\"].*//g" | \
  sort | uniq -c | sort -rn | head -15

echo ""
echo "=========================="
echo ""

# Find internal imports
echo "Most imported internal modules:"
grep -rh "from ['\"]\\./" app/ components/ lib/ 2>/dev/null | \
  sed "s/.*from ['\"]//g" | \
  sed "s/['\"].*//g" | \
  sort | uniq -c | sort -rn | head -10

echo ""

exit 0

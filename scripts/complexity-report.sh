#!/bin/bash

# Code Complexity Analysis Script
# Analyzes cyclomatic complexity and identifies problematic functions

set -e

echo "📊 Code Complexity Report"
echo "========================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create temp file for analysis
TEMP_FILE=$(mktemp)

echo "Analyzing TypeScript/JavaScript files..."
echo ""

# Function to calculate complexity (simple version)
analyze_file() {
  local file=$1
  local complexity=0
  
  # Count complexity indicators
  local if_count=$(grep -c "if " "$file" 2>/dev/null || echo "0")
  local for_count=$(grep -c "for " "$file" 2>/dev/null || echo "0")
  local while_count=$(grep -c "while " "$file" 2>/dev/null || echo "0")
  local case_count=$(grep -c "case " "$file" 2>/dev/null || echo "0")
  local catch_count=$(grep -c "catch" "$file" 2>/dev/null || echo "0")
  local ternary_count=$(grep -c "?" "$file" 2>/dev/null || echo "0")
  local and_count=$(grep -c "&&" "$file" 2>/dev/null || echo "0")
  local or_count=$(grep -c "||" "$file" 2>/dev/null || echo "0")
  
  # Ensure all are numbers
  if_count=${if_count:-0}
  for_count=${for_count:-0}
  while_count=${while_count:-0}
  case_count=${case_count:-0}
  catch_count=${catch_count:-0}
  ternary_count=${ternary_count:-0}
  and_count=${and_count:-0}
  or_count=${or_count:-0}
  
  complexity=$((if_count + for_count + while_count + case_count + catch_count + (ternary_count / 2) + (and_count / 2) + (or_count / 2)))
  
  echo "$complexity|$file"
}

# Analyze all TypeScript/JavaScript files
echo "📂 Scanning files..."
file_count=0
high_complexity=0
medium_complexity=0
low_complexity=0

while IFS= read -r file; do
  if [ -f "$file" ]; then
    result=$(analyze_file "$file")
    complexity=$(echo "$result" | cut -d'|' -f1)
    
    if [ "$complexity" -gt 30 ]; then
      echo -e "${RED}⚠️  HIGH: $complexity - $file${NC}" | tee -a "$TEMP_FILE"
      high_complexity=$((high_complexity + 1))
    elif [ "$complexity" -gt 15 ]; then
      echo -e "${YELLOW}⚠️  MED:  $complexity - $file${NC}" | tee -a "$TEMP_FILE"
      medium_complexity=$((medium_complexity + 1))
    else
      low_complexity=$((low_complexity + 1))
    fi
    
    file_count=$((file_count + 1))
  fi
done < <(find app/ components/ lib/ -name "*.ts" -o -name "*.tsx" 2>/dev/null)

echo ""
echo "========================="
echo "📈 Summary"
echo "========================="
echo -e "Total files analyzed: ${CYAN}$file_count${NC}"
echo -e "High complexity (>30): ${RED}$high_complexity${NC}"
echo -e "Medium complexity (>15): ${YELLOW}$medium_complexity${NC}"
echo -e "Low complexity: ${GREEN}$low_complexity${NC}"
echo ""

if [ "$high_complexity" -gt 0 ]; then
  echo -e "${RED}⚠️  Files with high complexity need refactoring!${NC}"
  echo ""
  echo "Recommendations:"
  echo "- Break down large functions into smaller ones"
  echo "- Extract complex logic into separate utilities"
  echo "- Use early returns to reduce nesting"
  echo "- Consider design patterns (Strategy, Factory, etc.)"
elif [ "$medium_complexity" -gt 3 ]; then
  echo -e "${YELLOW}⚠️  Several files have medium complexity${NC}"
  echo "Consider refactoring to improve maintainability"
else
  echo -e "${GREEN}✓ Code complexity is well managed!${NC}"
fi

echo ""

# Cleanup
rm -f "$TEMP_FILE"

exit 0

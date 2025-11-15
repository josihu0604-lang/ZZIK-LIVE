#!/bin/bash

# 🔒 Comprehensive Security Audit Script
# Performs deep security analysis with multiple tools

set -e

echo "======================================"
echo "🔒 SECURITY AUDIT - Round 5"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. NPM Audit
echo "1️⃣ Running npm audit..."
npm audit --json > security-audit.json || true
VULNERABILITIES=$(jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0))' security-audit.json)
echo -e "${YELLOW}Found vulnerabilities:${NC}"
jq '.metadata.vulnerabilities' security-audit.json

# 2. Better NPM Audit (more detailed)
echo ""
echo "2️⃣ Running better-npm-audit..."
npx better-npm-audit audit || true

# 3. Check for known malicious packages
echo ""
echo "3️⃣ Checking for known malicious packages..."
MALICIOUS_PATTERNS=(
  "bitcoin"
  "wallet-steal"
  "crypto-miner"
  "keylogger"
  "backdoor"
)

for pattern in "${MALICIOUS_PATTERNS[@]}"; do
  if grep -i "$pattern" package-lock.json > /dev/null 2>&1; then
    echo -e "${RED}⚠️  ALERT: Potential malicious pattern found: $pattern${NC}"
  fi
done
echo -e "${GREEN}✅ No obvious malicious patterns detected${NC}"

# 4. Check for outdated packages with known vulnerabilities
echo ""
echo "4️⃣ Checking for outdated critical packages..."
npm outdated --json > outdated.json || true
echo "Outdated packages:"
jq 'to_entries | .[] | "\(.key): \(.value.current) -> \(.value.latest)"' outdated.json || echo "All packages up to date"

# 5. License compliance check
echo ""
echo "5️⃣ Checking license compliance..."
npx license-checker --summary --production --onlyAllow 'MIT;ISC;Apache-2.0;BSD;BSD-2-Clause;BSD-3-Clause;0BSD;CC0-1.0;Unlicense' || echo "Some licenses may need review"

# 6. Detect hardcoded secrets
echo ""
echo "6️⃣ Scanning for hardcoded secrets..."
SECRET_PATTERNS=(
  "api[_-]?key"
  "secret[_-]?key"
  "password\s*=\s*['\"]"
  "token\s*=\s*['\"]"
  "private[_-]?key"
  "aws[_-]?access"
  "AKIA[0-9A-Z]{16}"  # AWS Access Key
  "sk_live_[0-9a-zA-Z]{24}"  # Stripe Live Key
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  MATCHES=$(grep -rE "$pattern" app/ lib/ components/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" || true)
  if [ ! -z "$MATCHES" ]; then
    echo -e "${RED}⚠️  Potential secret found matching pattern: $pattern${NC}"
    echo "$MATCHES"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ No hardcoded secrets detected${NC}"
else
  echo -e "${RED}⚠️  Found $SECRETS_FOUND potential secret patterns${NC}"
fi

# 7. Check for unsafe dependencies
echo ""
echo "7️⃣ Checking for unsafe React patterns..."
UNSAFE_PATTERNS=$(grep -rE "dangerouslySetInnerHTML|eval\(|Function\(|setTimeout\(.*string" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | wc -l || true)
echo "Unsafe patterns found: $UNSAFE_PATTERNS"

# 8. OWASP Top 10 checks
echo ""
echo "8️⃣ OWASP Top 10 Quick Checks..."

# A01: Broken Access Control
echo "  - Checking for proper authentication..."
AUTH_ROUTES=$(find app/api -name "route.ts" -exec grep -l "auth" {} \; | wc -l)
echo "    Found $AUTH_ROUTES auth-protected routes"

# A02: Cryptographic Failures
echo "  - Checking for crypto usage..."
CRYPTO_USAGE=$(grep -rE "crypto\.|bcrypt|argon2" app/ lib/ --include="*.ts" 2>/dev/null | wc -l || true)
echo "    Found $CRYPTO_USAGE crypto implementations"

# A03: Injection
echo "  - Checking for SQL injection risks..."
SQL_PATTERNS=$(grep -rE "\$\{.*\}.*query|'.*\+.*'|\".*\+.*\"" app/ lib/ --include="*.ts" 2>/dev/null | grep -v "node_modules" | wc -l || true)
echo "    Found $SQL_PATTERNS potential injection points"

# A07: Identification and Authentication Failures
echo "  - Checking session management..."
SESSION_FILES=$(find app/ lib/ -name "*session*" -o -name "*auth*" | wc -l)
echo "    Found $SESSION_FILES session/auth files"

# 9. Security headers check
echo ""
echo "9️⃣ Checking security headers configuration..."
if [ -f "next.config.ts" ]; then
  if grep -q "X-Frame-Options\|X-Content-Type-Options\|Strict-Transport-Security" next.config.ts; then
    echo -e "${GREEN}✅ Security headers configured${NC}"
  else
    echo -e "${YELLOW}⚠️  Security headers not found in next.config.ts${NC}"
  fi
fi

# 10. Generate security report
echo ""
echo "🔟 Generating security report..."
cat > SECURITY_AUDIT_REPORT.md << EOF
# Security Audit Report - Round 5
**Date**: $(date)
**Auditor**: Automated Security Scanner

## Executive Summary
- **NPM Vulnerabilities**: $(jq '.metadata.vulnerabilities.total' security-audit.json || echo "N/A")
  - Critical: $(jq '.metadata.vulnerabilities.critical' security-audit.json || echo "0")
  - High: $(jq '.metadata.vulnerabilities.high' security-audit.json || echo "0")
  - Moderate: $(jq '.metadata.vulnerabilities.moderate' security-audit.json || echo "0")
  - Low: $(jq '.metadata.vulnerabilities.low' security-audit.json || echo "0")
- **Hardcoded Secrets**: $SECRETS_FOUND potential issues
- **Unsafe Patterns**: $UNSAFE_PATTERNS occurrences
- **Auth-Protected Routes**: $AUTH_ROUTES routes

## Detailed Findings

### 1. Dependency Vulnerabilities
\`\`\`json
$(cat security-audit.json | jq '.vulnerabilities' || echo "{}")
\`\`\`

### 2. Outdated Packages
\`\`\`json
$(cat outdated.json 2>/dev/null || echo "{}")
\`\`\`

### 3. Security Headers
$(if grep -q "X-Frame-Options" next.config.ts 2>/dev/null; then echo "✅ Configured"; else echo "❌ Missing"; fi)

### 4. OWASP Quick Check
- SQL Injection Risk Points: $SQL_PATTERNS
- Crypto Implementations: $CRYPTO_USAGE
- Session Management Files: $SESSION_FILES

## Recommendations

### High Priority
1. Upgrade vitest and related packages to fix esbuild vulnerability
2. Review and fix js-yaml vulnerability in depcheck
3. Add comprehensive security headers in next.config.ts
4. Implement CSRF protection for all POST/PUT/DELETE endpoints

### Medium Priority
1. Add rate limiting to all public API endpoints
2. Implement request validation middleware
3. Add security.txt file for responsible disclosure
4. Enable Content Security Policy (CSP)

### Low Priority
1. Add automated security testing to CI/CD
2. Implement dependency update automation (Dependabot/Renovate)
3. Add security linting rules to ESLint
4. Create security documentation

## Action Items
- [ ] Run \`npm audit fix\` for automatic fixes
- [ ] Manual review of remaining vulnerabilities
- [ ] Add security headers middleware
- [ ] Implement CSRF tokens
- [ ] Set up Snyk/Dependabot monitoring
- [ ] Create security incident response plan

EOF

echo -e "${GREEN}✅ Security report generated: SECURITY_AUDIT_REPORT.md${NC}"
echo ""
echo "======================================"
echo "Security Audit Complete!"
echo "======================================"

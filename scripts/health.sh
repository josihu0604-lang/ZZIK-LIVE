#!/usr/bin/env bash
# Health check script for ZZIK LIVE project
set -euo pipefail

echo "🏥 ZZIK LIVE Health Check"
echo "========================"

# Check Node.js and npm versions
echo "
📦 Environment:"
echo "Node: $(node -v 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm -v 2>/dev/null || echo 'Not installed')"
echo "Expected: Node v20.19.5 / npm >=10.8.2"

# Check required Node version
REQUIRED_NODE="20.19.5"
CURRENT_NODE=$(node -v 2>/dev/null | sed 's/v//' || echo "0.0.0")
if [ "$CURRENT_NODE" != "$REQUIRED_NODE" ]; then
  echo "⚠️  WARNING: Node version mismatch (current: $CURRENT_NODE, required: $REQUIRED_NODE)"
fi

# Check for port conflicts
echo "
🌐 Port Status:"
for PORT in 3000 3001 5432 6379; do
  if lsof -i:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is in use"
  else
    echo "✅ Port $PORT is available"
  fi
done

# Check for required environment variables
echo "
🔐 Environment Variables:"
ENV_VARS=("DATABASE_URL" "NEXT_PUBLIC_MAPBOX_TOKEN" "NEXT_PUBLIC_APP_URL")
for VAR in "${ENV_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    echo "❌ $VAR is not set"
  else
    echo "✅ $VAR is configured"
  fi
done

# Check if .env.example exists
if [ -f ".env.example" ]; then
  echo "✅ .env.example found"
else
  echo "⚠️  .env.example not found"
fi

# Run quick lint check
echo "
🔍 Code Quality:"
if command -v npm >/dev/null 2>&1 && [ -f "package.json" ]; then
  echo "Running lint check..."
  npm run -s lint 2>/dev/null && echo "✅ Lint passed" || echo "❌ Lint failed"
  
  echo "Running type check..."
  npm run -s typecheck 2>/dev/null && echo "✅ Type check passed" || echo "❌ Type check failed"
else
  echo "⚠️  Skipping checks (npm not available or package.json missing)"
fi

# Check for geo-privacy compliance
echo "
🔒 Geo-Privacy Compliance:"
SUSPICIOUS_FILES=$(grep -r -l "\(latitude\|longitude\|\blat\b\|\blng\b\)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist 2>/dev/null | wc -l || echo "0")
if [ "$SUSPICIOUS_FILES" -gt "0" ]; then
  echo "⚠️  Found $SUSPICIOUS_FILES files with potential raw coordinate references"
  echo "   Review these files to ensure they use geohash5 instead"
else
  echo "✅ No raw coordinate references found"
fi

# Check disk space
echo "
💾 Disk Space:"
df -h . | tail -1 | awk '{print "Available: " $4 " (" $5 " used)"}'

# Summary
echo "
📋 Summary:"
echo "Health check completed. Review any warnings above."
echo "For detailed diagnostics, run: npm run test"
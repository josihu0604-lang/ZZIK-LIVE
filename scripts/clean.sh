#!/usr/bin/env bash
# Clean build artifacts and temporary files
set -euo pipefail

echo "🧹 Starting cleanup..."

# Skip node_modules directories
find . -name "node_modules" -type d -prune -exec echo "Skipping {}/" \;

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf **/.next **/dist **/coverage **/.playwright **/.k6 2>/dev/null || true
rm -rf .next dist coverage .playwright .k6 2>/dev/null || true

# Remove log files
echo "Removing log files..."
rm -rf **/*.log **/npm-debug.log* **/yarn-error.log* 2>/dev/null || true

# Remove test artifacts
echo "Removing test artifacts..."
rm -rf **/test-results **/.nyc_output 2>/dev/null || true

# Remove cache directories
echo "Removing cache directories..."
rm -rf **/.cache **/.parcel-cache **/.turbo 2>/dev/null || true

# Remove temporary files
echo "Removing temporary files..."
rm -rf **/*.tmp **/*.temp **/*.bak **/*.backup 2>/dev/null || true

# Clean TypeScript build info
echo "Removing TypeScript build info..."
rm -rf **/tsconfig.tsbuildinfo 2>/dev/null || true

echo "✅ Cleanup completed!"
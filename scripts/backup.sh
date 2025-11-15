#!/usr/bin/env bash
# Create backup of the project
set -euo pipefail

# Generate timestamp for backup filename
TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
BACKUP_NAME="zzik_backup_${TIMESTAMP}.tar.gz"

echo "📦 Creating backup: ${BACKUP_NAME}"

# Create backup excluding unnecessary files
tar --exclude-vcs \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='coverage' \
    --exclude='.playwright' \
    --exclude='.k6' \
    --exclude='*.log' \
    --exclude='*.tmp' \
    --exclude='*.temp' \
    --exclude='*.bak' \
    --exclude='*.backup' \
    --exclude='**/*.mp4' \
    --exclude='**/*.mov' \
    --exclude='**/*.webm' \
    --exclude='.env*' \
    --exclude='!.env.example' \
    -czf "${BACKUP_NAME}" .

# Calculate backup size
BACKUP_SIZE=$(ls -lh "${BACKUP_NAME}" | awk '{print $5}')

echo "✅ Backup created: ${BACKUP_NAME} (${BACKUP_SIZE})"
echo "📍 Location: $(pwd)/${BACKUP_NAME}"
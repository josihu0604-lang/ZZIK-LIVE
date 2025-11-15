#!/usr/bin/env bash
# DB Setup & Smoke Test Script
# Part of vNext hardening pack

set -euo pipefail

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}🗄️  ZZIK LIVE DB Setup${COLOR_RESET}"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${COLOR_RED}✗${COLOR_RESET} Docker is not running"
  echo "Please start Docker and try again"
  exit 1
fi

# 1) Start DB services
echo -e "${COLOR_BLUE}1. Starting PostgreSQL + Redis...${COLOR_RESET}"
docker compose -f infra/docker-compose.db.yml up -d

# Wait for DB health check
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose -f infra/docker-compose.db.yml exec -T db pg_isready -U zzik -d zzik_live > /dev/null 2>&1; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} PostgreSQL is ready"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    echo -e "${COLOR_RED}✗${COLOR_RESET} PostgreSQL failed to start"
    exit 1
  fi
done
echo ""

# 2) Verify extensions
echo -e "${COLOR_BLUE}2. Verifying PostGIS extensions...${COLOR_RESET}"
EXTENSIONS=$(docker compose -f infra/docker-compose.db.yml exec -T db psql -U zzik -d zzik_live -t -c "SELECT count(*) FROM pg_extension WHERE extname IN ('postgis', 'pg_trgm', 'uuid-ossp');")
if [ "$EXTENSIONS" -ge 3 ]; then
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} All required extensions installed"
else
  echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} Running extension setup..."
  docker compose -f infra/docker-compose.db.yml exec -T db psql -U zzik -d zzik_live < infra/init-scripts/01-extensions.sql
fi
echo ""

# 3) Run Prisma migrations
echo -e "${COLOR_BLUE}3. Running Prisma migrations...${COLOR_RESET}"
export DATABASE_URL="postgresql://zzik:zzik@127.0.0.1:5432/zzik_live"

if ! command -v npx > /dev/null; then
  echo -e "${COLOR_RED}✗${COLOR_RESET} npx not found. Please install Node.js"
  exit 1
fi

npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} Migrations completed"
else
  echo -e "${COLOR_RED}✗${COLOR_RESET} Migration failed"
  exit 1
fi
echo ""

# 4) Seed test data
echo -e "${COLOR_BLUE}4. Seeding test data...${COLOR_RESET}"
if [ -f scripts/seed-test-data.sql ]; then
  docker compose -f infra/docker-compose.db.yml exec -T db psql -U zzik -d zzik_live < scripts/seed-test-data.sql
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} Test data seeded"
else
  echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} seed-test-data.sql not found, skipping"
fi
echo ""

# 5) Verify DB structure
echo -e "${COLOR_BLUE}5. Verifying database structure...${COLOR_RESET}"
TABLE_COUNT=$(docker compose -f infra/docker-compose.db.yml exec -T db psql -U zzik -d zzik_live -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Tables created: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${COLOR_GREEN}✓${COLOR_RESET} Database structure verified"
else
  echo -e "${COLOR_RED}✗${COLOR_RESET} No tables found"
  exit 1
fi
echo ""

# 6) Connection info
echo "=================================="
echo -e "${COLOR_GREEN}✅ DB Setup Complete${COLOR_RESET}"
echo "=================================="
echo ""
echo "PostgreSQL:"
echo "  Host: 127.0.0.1:5432"
echo "  Database: zzik_live"
echo "  User: zzik"
echo "  Password: zzik"
echo ""
echo "Redis:"
echo "  Host: 127.0.0.1:6379"
echo ""
echo "Connection string:"
echo "  DATABASE_URL=postgresql://zzik:zzik@127.0.0.1:5432/zzik_live"
echo ""
echo "Next steps:"
echo "  1. Run smoke tests: npm run bench:smoke"
echo "  2. Run k6 tests: k6 run k6/api-smoke.js"
echo "  3. View DB: npx prisma studio"
echo ""

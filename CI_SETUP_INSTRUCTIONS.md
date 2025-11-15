# CI Setup Instructions for PR Verification

## Issue
GitHub Actions workflow files cannot be pushed via GitHub App authentication without `workflows` permission. The workflow file `.github/workflows/verify-pr.yml` needs to be added to the main branch manually.

## Solution: Manual Workflow Setup

### Option 1: Direct Push to Main (Recommended)
If you have direct access to the main branch:

```bash
# Checkout main branch
git checkout main
git pull origin main

# Create workflow file
mkdir -p .github/workflows
cat > .github/workflows/verify-pr.yml << 'EOF'
# Copy the content from the workflow file below
EOF

# Commit and push
git add .github/workflows/verify-pr.yml
git commit -m "ci: add verification PR workflow"
git push origin main
```

### Option 2: Separate PR for Workflow
Create a minimal PR just for the workflow file:

```bash
# Create new branch from main
git checkout main
git pull origin main
git checkout -b add-verify-workflow

# Add workflow file (content below)
mkdir -p .github/workflows
# Create the file with content below

# Commit and push
git add .github/workflows/verify-pr.yml
git commit -m "ci: add verification PR workflow"
git push origin add-verify-workflow

# Create PR
gh pr create --base main --head add-verify-workflow \
  --title "ci: add verification PR workflow" \
  --body "Add GitHub Actions workflow for automated PR verification"
```

### Option 3: GitHub UI
1. Go to repository on GitHub
2. Navigate to `.github/workflows/`
3. Click "Add file" → "Create new file"
4. Name: `verify-pr.yml`
5. Paste content below
6. Commit directly to main or create new branch

## Workflow File Content

```yaml
name: Verify PR

on:
  pull_request:
    branches: [main]
  push:
    branches: [genspark_ai_developer]

jobs:
  verify-changes:
    name: Verify Code Changes
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: zzik_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zzik_test
        run: |
          npm run db:migrate
          psql "$DATABASE_URL" -f scripts/seed-mini.sql || true
          psql "$DATABASE_URL" -f scripts/seed-verify.sql || true
      
      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zzik_test
          REDIS_URL: redis://localhost:6379
        run: npm run test
      
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zzik_test
          REDIS_URL: redis://localhost:6379
          BASE_URL: http://localhost:3000
        run: |
          npm run build
          npm run start &
          sleep 10
          npx playwright test e2e/verify-api.spec.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
          retention-days: 7

  performance-check:
    name: Performance Verification
    runs-on: ubuntu-latest
    needs: verify-changes
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: zzik_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zzik_test
        run: |
          npm run db:migrate
          psql "$DATABASE_URL" -f scripts/seed-mini.sql || true
          psql "$DATABASE_URL" -f scripts/seed-verify.sql || true
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Start server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zzik_test
          REDIS_URL: redis://localhost:6379
        run: |
          npm run build
          npm run start &
          sleep 15
      
      - name: Run k6 QR verification smoke test
        env:
          BASE_URL: http://localhost:3000
        run: |
          k6 run k6/qr-smoke.js -e BASE_URL=http://localhost:3000
      
      - name: Upload k6 results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: k6-results/
          retention-days: 7

  security-check:
    name: Security & Privacy Verification
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run privacy scan
        run: |
          chmod +x scripts/privacy-scan.sh
          ./scripts/privacy-scan.sh
      
      - name: Check for security vulnerabilities
        run: npm audit --audit-level=moderate
      
      - name: Verify headers (static check)
        run: |
          # Check that required headers are present in code
          grep -r "X-Verification-State" app/api/qr/verify/ || (echo "Missing X-Verification-State header" && exit 1)
          grep -r "X-Idempotent-Replay" app/api/qr/verify/ || (echo "Missing X-Idempotent-Replay header" && exit 1)
          grep -r "X-RateLimit-" app/api/ || (echo "Missing rate limit headers" && exit 1)
```

## Verification

After adding the workflow:

1. The workflow should appear in `.github/workflows/verify-pr.yml` on main branch
2. Go to Actions tab on GitHub to see the workflow
3. New PRs or pushes to `genspark_ai_developer` will trigger the checks
4. PR #1 should show "Checks" section with test results

## Expected Checks

Once enabled, PRs will show:
- ✅ Verify Code Changes (type check, lint, unit tests, E2E tests)
- ✅ Performance Verification (k6 p95 < 800ms)
- ✅ Security & Privacy Verification (audit, privacy scan)

## Troubleshooting

If checks don't run:
1. Verify workflow file exists in main branch
2. Check Actions tab → Workflows → "Verify PR" is enabled
3. Repository Settings → Actions → General → Allow all actions
4. Re-push to `genspark_ai_developer` branch to trigger workflow
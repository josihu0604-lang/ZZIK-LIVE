# CI Workflow Setup Instructions

## ⚠️ GitHub App Workflow Permissions Issue

Due to GitHub App restrictions, workflow files (`.github/workflows/*`) cannot be created or updated through the GitHub App API without explicit `workflows` permission.

## 🔧 Manual Setup Required

### Option 1: Direct File Creation (Recommended)

1. Go to your repository: https://github.com/josihu0604-lang/ZZIK-LIVE

2. Navigate to `.github/workflows/` directory (create if doesn't exist)

3. Click "Add file" → "Create new file"

4. Name the file: `ci.yml`

5. Copy and paste the content from the file below

### Option 2: Local Push with Personal Access Token

If you have a Personal Access Token (PAT) with `workflow` scope:

```bash
# Add the workflow file
mkdir -p .github/workflows
cp /path/to/ci.yml .github/workflows/ci.yml

# Commit and push
git add .github/workflows/ci.yml
git commit -m "ci: Add comprehensive CI/CD pipeline"
git push origin main
```

## 📄 CI Workflow Content

Create `.github/workflows/ci.yml` with the following content:

\`\`\`yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Check TypeScript
        run: npm run type-check

  test-unit:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
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
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          npx prisma generate
          npx prisma db push
          
      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
        run: npm run test:unit -- --coverage
        
      - name: Upload coverage
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: coverage-report
          path: coverage/

  test-integration:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
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
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          npx prisma generate
          npx prisma db push
          npx prisma db seed
          
      - name: Build application
        run: npm run build
        
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret-for-ci
        run: npm run test:integration

  test-e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
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
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          npx prisma generate
          npx prisma db push
          npx prisma db seed
          
      - name: Build application
        run: npm run build
        
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret-for-ci
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  test-a11y:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Build application
        run: npm run build
        
      - name: Run accessibility tests
        run: npm run test:a11y
        
      - name: Upload accessibility report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: a11y-report
          path: test-results/a11y/

  security-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run security audit
        run: npm audit --audit-level=moderate
        
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  build-docker:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: zzik-live:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
      - name: Test Docker image
        run: |
          docker run --rm zzik-live:\${{ github.sha }} node --version
          
  deploy-check:
    needs: [lint, test-unit, test-integration, test-e2e, test-a11y, security-scan, build-docker]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: All checks passed
        run: echo "✅ All CI checks passed! Ready for deployment."
\`\`\`

## 🎯 What This Workflow Does

1. **Linting & Type Checking**: Ensures code quality and type safety
2. **Unit Tests**: Runs with PostgreSQL and Redis services
3. **Integration Tests**: Full application integration testing
4. **E2E Tests**: End-to-end tests with Playwright
5. **Accessibility Tests**: Automated a11y testing with axe-core
6. **Security Scanning**: npm audit and Snyk vulnerability scanning
7. **Docker Build**: Validates Docker image builds
8. **Deploy Check**: Final gate before deployment

## ✅ After Setup

Once the workflow file is created:
- All pushes to `main` or `develop` will trigger the CI pipeline
- All pull requests to `main` will be validated
- You can view workflow runs at: https://github.com/josihu0604-lang/ZZIK-LIVE/actions

## 🔍 Troubleshooting

If workflows don't run:
1. Check GitHub Actions is enabled in repository settings
2. Verify the workflow file syntax
3. Check repository permissions for Actions

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

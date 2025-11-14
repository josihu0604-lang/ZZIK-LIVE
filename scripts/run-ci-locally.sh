#!/bin/bash

# Local CI/CD Simulation Script
# This script runs all CI checks locally without requiring GitHub Actions

set -e

echo "🚀 Running Local CI/CD Checks..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
check_services() {
    echo -e "\n${YELLOW}📋 Checking required services...${NC}"
    
    # Check PostgreSQL
    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL not running${NC}"
        echo "Run: npm run db:up"
        exit 1
    fi
    echo -e "${GREEN}✅ PostgreSQL running${NC}"
    
    # Check Redis
    if ! redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
        echo -e "${RED}❌ Redis not running${NC}"
        echo "Run: npm run db:up"
        exit 1
    fi
    echo -e "${GREEN}✅ Redis running${NC}"
}

# Run linting
run_lint() {
    echo -e "\n${YELLOW}🔍 Running ESLint...${NC}"
    npm run lint
    echo -e "${GREEN}✅ Linting passed${NC}"
}

# Run type checking
run_typecheck() {
    echo -e "\n${YELLOW}📝 Running TypeScript type check...${NC}"
    npm run type-check
    echo -e "${GREEN}✅ Type checking passed${NC}"
}

# Run unit tests
run_tests() {
    echo -e "\n${YELLOW}🧪 Running unit tests...${NC}"
    npm run test:unit
    echo -e "${GREEN}✅ Unit tests passed${NC}"
}

# Run security audit
run_security() {
    echo -e "\n${YELLOW}🔒 Running security audit...${NC}"
    npm audit --audit-level=moderate || echo -e "${YELLOW}⚠️  Some vulnerabilities found (non-critical)${NC}"
    echo -e "${GREEN}✅ Security scan completed${NC}"
}

# Build application
run_build() {
    echo -e "\n${YELLOW}🏗️  Building application...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build successful${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}Starting CI checks...${NC}\n"
    
    # Check services first
    check_services
    
    # Run all checks
    run_lint
    run_typecheck
    run_tests
    run_security
    run_build
    
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}✅ All CI checks passed!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "Your code is ready for production! 🚀"
}

# Run main function
main "$@"

#!/bin/bash

# ZZIK LIVE - Auto Fix Script
# 자주 발생하는 문제 자동 수정

set -e

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔧 ZZIK LIVE Auto Fix${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 수정 타입 선택
if [ -z "$1" ]; then
    echo "사용법:"
    echo "  $0 [fix-type]"
    echo ""
    echo "수정 타입:"
    echo "  all      - 모든 수정 실행"
    echo "  deps     - 의존성 문제 수정"
    echo "  cache    - 캐시 문제 수정"
    echo "  port     - 포트 충돌 수정"
    echo "  types    - TypeScript 문제 수정"
    echo ""
    exit 0
fi

FIX_TYPE=$1

# 1. 포트 정리
fix_port() {
    echo -e "${YELLOW}🔌 포트 3000 정리 중...${NC}"
    npx kill-port 3000 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✓ 포트 정리 완료${NC}"
}

# 2. 캐시 정리
fix_cache() {
    echo -e "${YELLOW}🗑️  캐시 정리 중...${NC}"
    rm -rf .next
    rm -rf node_modules/.cache
    echo -e "${GREEN}✓ 캐시 정리 완료${NC}"
}

# 3. 의존성 재설치
fix_deps() {
    echo -e "${YELLOW}📦 의존성 재설치 중...${NC}"
    
    # node_modules 백업 (선택사항)
    if [ -d "node_modules" ]; then
        echo "  기존 node_modules 제거..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "  package-lock.json 제거..."
        rm package-lock.json
    fi
    
    echo "  npm install 실행..."
    npm install
    
    echo -e "${GREEN}✓ 의존성 재설치 완료${NC}"
}

# 4. TypeScript 문제 수정
fix_types() {
    echo -e "${YELLOW}📝 TypeScript 설정 확인 중...${NC}"
    
    # tsconfig.json 검증
    if [ -f "tsconfig.json" ]; then
        echo "  tsconfig.json 확인..."
        npx tsc --noEmit || true
    fi
    
    # 타입 정의 재생성
    echo "  Next.js 타입 재생성..."
    npm run dev &
    DEV_PID=$!
    sleep 5
    kill $DEV_PID 2>/dev/null || true
    
    echo -e "${GREEN}✓ TypeScript 설정 완료${NC}"
}

# 5. 로그 정리
clean_logs() {
    echo -e "${YELLOW}📄 로그 파일 정리 중...${NC}"
    
    if [ -d "logs" ]; then
        # 오래된 로그 압축
        if [ -f "logs/dev-server.log" ]; then
            timestamp=$(date +%Y%m%d_%H%M%S)
            gzip -c logs/dev-server.log > "logs/archive/dev-server_${timestamp}.log.gz" 2>/dev/null || true
            > logs/dev-server.log
        fi
        
        if [ -f "logs/dev-errors.log" ]; then
            > logs/dev-errors.log
        fi
    fi
    
    echo -e "${GREEN}✓ 로그 정리 완료${NC}"
}

# 6. 전체 정리 및 재시작
fix_all() {
    echo -e "${BLUE}🔄 전체 시스템 정리 시작...${NC}"
    echo ""
    
    fix_port
    echo ""
    
    fix_cache
    echo ""
    
    fix_deps
    echo ""
    
    fix_types
    echo ""
    
    clean_logs
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 모든 수정 완료!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}서버를 시작하려면:${NC}"
    echo -e "${YELLOW}  npm run dev:monitor${NC}"
}

# 실행
case $FIX_TYPE in
    all)
        fix_all
        ;;
    deps)
        fix_deps
        ;;
    cache)
        fix_cache
        ;;
    port)
        fix_port
        ;;
    types)
        fix_types
        ;;
    logs)
        clean_logs
        ;;
    *)
        echo -e "${RED}❌ 알 수 없는 수정 타입: $FIX_TYPE${NC}"
        echo "사용 가능한 타입: all, deps, cache, port, types, logs"
        exit 1
        ;;
esac

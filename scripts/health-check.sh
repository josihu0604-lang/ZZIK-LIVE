#!/bin/bash

# ZZIK LIVE - Health Check Script
# 서버 상태 및 오류 체크

set -e

PORT=3000
URL="http://localhost:$PORT"
LOG_FILE="logs/dev-server.log"
ERROR_LOG="logs/dev-errors.log"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏥 ZZIK LIVE Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 포트 체크
echo -n "🔌 포트 $PORT 체크... "
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 정상${NC}"
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    echo -e "   PID: $PID"
else
    echo -e "${RED}✗ 서버가 실행되고 있지 않습니다${NC}"
    exit 1
fi

# 2. HTTP 응답 체크
echo -n "🌐 HTTP 응답 체크... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL || echo "000")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 307 ]; then
    echo -e "${GREEN}✓ 정상 ($HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ 비정상 ($HTTP_CODE)${NC}"
fi

# 3. 응답 시간 체크
echo -n "⏱️  응답 시간 체크... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $URL || echo "0")
echo -e "${GREEN}${RESPONSE_TIME}초${NC}"
if (( $(echo "$RESPONSE_TIME > 3" | bc -l) )); then
    echo -e "   ${YELLOW}⚠️  응답이 느립니다 (> 3초)${NC}"
fi

# 4. 메모리 사용량 체크
echo -n "💾 메모리 사용량... "
if [ ! -z "$PID" ]; then
    MEM=$(ps -p $PID -o %mem | tail -n 1)
    echo -e "${GREEN}${MEM}%${NC}"
    if (( $(echo "$MEM > 80" | bc -l) )); then
        echo -e "   ${YELLOW}⚠️  메모리 사용량이 높습니다${NC}"
    fi
fi

# 5. 최근 오류 체크
echo ""
echo "📋 최근 오류 (최근 10개):"
if [ -f "$ERROR_LOG" ]; then
    tail -n 10 "$ERROR_LOG" | while read line; do
        echo -e "${RED}  • $line${NC}"
    done
    
    ERROR_COUNT=$(wc -l < "$ERROR_LOG")
    echo ""
    echo -e "   총 오류 수: ${RED}$ERROR_COUNT${NC}"
else
    echo -e "${GREEN}  ✓ 오류 없음${NC}"
fi

# 6. 로그 파일 크기
echo ""
echo -n "📄 로그 파일 크기... "
if [ -f "$LOG_FILE" ]; then
    SIZE=$(du -h "$LOG_FILE" | cut -f1)
    echo -e "${GREEN}$SIZE${NC}"
    
    # 로그 파일이 너무 큰 경우
    SIZE_MB=$(du -m "$LOG_FILE" | cut -f1)
    if [ "$SIZE_MB" -gt 100 ]; then
        echo -e "   ${YELLOW}⚠️  로그 파일이 큽니다. 정리를 권장합니다.${NC}"
        echo -e "   ${BLUE}실행: npm run logs:clean${NC}"
    fi
fi

# 7. Node.js 프로세스 정보
echo ""
echo "🔧 Node.js 프로세스 정보:"
if [ ! -z "$PID" ]; then
    ps -p $PID -o pid,ppid,%cpu,%mem,etime,cmd | tail -n 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Health Check 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

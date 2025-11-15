#!/bin/bash

# ZZIK LIVE - Development Server Monitor
# 개발 서버 자동 재시작 및 오류 모니터링

set -e

# 설정
PORT=3000
LOG_FILE="logs/dev-server.log"
ERROR_LOG="logs/dev-errors.log"
MAX_RETRIES=5
RETRY_COUNT=0

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 디렉토리 생성
mkdir -p logs

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 ZZIK LIVE Development Server Monitor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 포트 사용 중인지 확인
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  포트 $PORT가 이미 사용 중입니다.${NC}"
        echo -e "${YELLOW}기존 프로세스를 종료합니다...${NC}"
        npx kill-port $PORT
        sleep 2
    fi
}

# 서버 시작
start_server() {
    echo -e "${GREEN}▶️  개발 서버를 시작합니다...${NC}"
    npm run dev >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    echo -e "${GREEN}✓ 서버 시작됨 (PID: $SERVER_PID)${NC}"
    echo $SERVER_PID > logs/server.pid
}

# 서버 상태 확인
check_server() {
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 오류 로그 모니터링
monitor_errors() {
    tail -f "$LOG_FILE" | while read line; do
        # 오류 패턴 감지
        if echo "$line" | grep -i "error\|exception\|failed\|cannot" > /dev/null; then
            echo -e "${RED}❌ 오류 감지:${NC} $line" | tee -a "$ERROR_LOG"
            
            # 치명적 오류인 경우
            if echo "$line" | grep -i "fatal\|crash\|EADDRINUSE" > /dev/null; then
                echo -e "${RED}🔥 치명적 오류 발견! 서버를 재시작합니다...${NC}"
                return 1
            fi
        fi
    done
}

# 메인 루프
main() {
    # 초기 포트 체크
    check_port
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        # 서버 시작
        start_server
        
        # 서버가 정상적으로 시작될 때까지 대기
        sleep 5
        
        if check_server; then
            echo -e "${GREEN}✓ 서버가 정상적으로 실행 중입니다${NC}"
            echo -e "${BLUE}📊 로그: $LOG_FILE${NC}"
            echo -e "${BLUE}🌐 URL: http://localhost:$PORT${NC}"
            echo ""
            echo -e "${YELLOW}서버 모니터링 중... (Ctrl+C로 종료)${NC}"
            
            # 오류 모니터링
            if monitor_errors; then
                # 정상 종료
                break
            else
                # 오류로 인한 재시작
                RETRY_COUNT=$((RETRY_COUNT + 1))
                echo -e "${YELLOW}⚠️  재시작 시도 $RETRY_COUNT/$MAX_RETRIES${NC}"
                
                # 기존 서버 종료
                kill $SERVER_PID 2>/dev/null || true
                sleep 3
            fi
        else
            echo -e "${RED}❌ 서버 시작 실패${NC}"
            RETRY_COUNT=$((RETRY_COUNT + 1))
            sleep 5
        fi
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ 최대 재시도 횟수 초과. 서버를 종료합니다.${NC}"
        exit 1
    fi
}

# 종료 시그널 처리
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 서버를 종료합니다...${NC}"
    if [ -f logs/server.pid ]; then
        kill $(cat logs/server.pid) 2>/dev/null || true
        rm logs/server.pid
    fi
    echo -e "${GREEN}✓ 종료 완료${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 실행
main

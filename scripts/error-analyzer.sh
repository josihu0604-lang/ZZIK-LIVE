#!/bin/bash

# ZZIK LIVE - Error Analyzer
# 콘솔 오류 분석 및 해결 방안 제시

set -e

LOG_FILE="logs/dev-server.log"
ERROR_LOG="logs/dev-errors.log"
ANALYSIS_FILE="logs/error-analysis.txt"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🔍 ZZIK LIVE Error Analyzer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "$LOG_FILE" ]; then
    echo -e "${YELLOW}⚠️  로그 파일이 없습니다: $LOG_FILE${NC}"
    exit 0
fi

# 분석 시작
echo "📊 오류 패턴 분석 중..." > "$ANALYSIS_FILE"
date >> "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"

# 오류 타입별 카운트
echo -e "${BLUE}1️⃣  오류 타입별 통계${NC}"
echo "=== 오류 타입별 통계 ===" >> "$ANALYSIS_FILE"

# TypeScript 오류
TS_ERRORS=$(grep -i "TypeScript\|TS[0-9]" "$LOG_FILE" 2>/dev/null | wc -l || echo 0)
if [ $TS_ERRORS -gt 0 ]; then
    echo -e "${RED}  • TypeScript 오류: $TS_ERRORS${NC}"
    echo "  TypeScript 오류: $TS_ERRORS" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}    해결: npm run build로 타입 체크${NC}"
fi

# Module 오류
MODULE_ERRORS=$(grep -i "Cannot find module\|Module not found" "$LOG_FILE" 2>/dev/null | wc -l || echo 0)
if [ $MODULE_ERRORS -gt 0 ]; then
    echo -e "${RED}  • Module 오류: $MODULE_ERRORS${NC}"
    echo "  Module 오류: $MODULE_ERRORS" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}    해결: npm install로 의존성 재설치${NC}"
fi

# Import 오류
IMPORT_ERRORS=$(grep -i "import\|require" "$LOG_FILE" 2>/dev/null | grep -i "error" | wc -l || echo 0)
if [ $IMPORT_ERRORS -gt 0 ]; then
    echo -e "${RED}  • Import 오류: $IMPORT_ERRORS${NC}"
    echo "  Import 오류: $IMPORT_ERRORS" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}    해결: import 경로 확인${NC}"
fi

# Hydration 오류
HYDRATION_ERRORS=$(grep -i "hydration\|mismatch" "$LOG_FILE" 2>/dev/null | wc -l || echo 0)
if [ $HYDRATION_ERRORS -gt 0 ]; then
    echo -e "${RED}  • Hydration 오류: $HYDRATION_ERRORS${NC}"
    echo "  Hydration 오류: $HYDRATION_ERRORS" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}    해결: 서버/클라이언트 렌더링 차이 확인${NC}"
fi

# Network 오류
NETWORK_ERRORS=$(grep -i "fetch failed\|network\|ECONNREFUSED" "$LOG_FILE" 2>/dev/null | wc -l || echo 0)
if [ $NETWORK_ERRORS -gt 0 ]; then
    echo -e "${RED}  • Network 오류: $NETWORK_ERRORS${NC}"
    echo "  Network 오류: $NETWORK_ERRORS" >> "$ANALYSIS_FILE"
    echo -e "${YELLOW}    해결: API 엔드포인트 및 네트워크 연결 확인${NC}"
fi

# 2. 가장 빈번한 오류 메시지
echo ""
echo -e "${BLUE}2️⃣  가장 빈번한 오류 (Top 5)${NC}"
echo "" >> "$ANALYSIS_FILE"
echo "=== 가장 빈번한 오류 ===" >> "$ANALYSIS_FILE"

grep -i "error\|exception\|failed" "$LOG_FILE" 2>/dev/null | \
    sort | uniq -c | sort -rn | head -5 | while read count message; do
    echo -e "${RED}  [$count회] ${NC}${message:0:80}..."
    echo "  [$count회] ${message:0:80}..." >> "$ANALYSIS_FILE"
done

# 3. 시간대별 오류 분석
echo ""
echo -e "${BLUE}3️⃣  최근 오류 타임라인 (최근 10개)${NC}"
echo "" >> "$ANALYSIS_FILE"
echo "=== 최근 오류 타임라인 ===" >> "$ANALYSIS_FILE"

grep -i "error\|exception\|failed" "$LOG_FILE" 2>/dev/null | tail -10 | while read line; do
    echo -e "${RED}  • ${NC}${line:0:100}..."
    echo "  • ${line:0:100}..." >> "$ANALYSIS_FILE"
done

# 4. 자동 수정 가능한 오류
echo ""
echo -e "${BLUE}4️⃣  자동 수정 가능한 문제${NC}"
echo "" >> "$ANALYSIS_FILE"
echo "=== 자동 수정 제안 ===" >> "$ANALYSIS_FILE"

CAN_FIX=0

# node_modules 문제
if grep -i "node_modules\|npm\|package" "$LOG_FILE" 2>/dev/null | grep -i "error" > /dev/null; then
    echo -e "${GREEN}  ✓ 의존성 재설치로 해결 가능${NC}"
    echo -e "${YELLOW}    실행: npm run fix:deps${NC}"
    echo "  의존성 재설치로 해결 가능" >> "$ANALYSIS_FILE"
    CAN_FIX=1
fi

# 캐시 문제
if grep -i "cache\|.next" "$LOG_FILE" 2>/dev/null | grep -i "error" > /dev/null; then
    echo -e "${GREEN}  ✓ 캐시 정리로 해결 가능${NC}"
    echo -e "${YELLOW}    실행: npm run fix:cache${NC}"
    echo "  캐시 정리로 해결 가능" >> "$ANALYSIS_FILE"
    CAN_FIX=1
fi

# 포트 충돌
if grep -i "EADDRINUSE\|port.*in use" "$LOG_FILE" 2>/dev/null > /dev/null; then
    echo -e "${GREEN}  ✓ 포트 정리로 해결 가능${NC}"
    echo -e "${YELLOW}    실행: npm run fix:port${NC}"
    echo "  포트 정리로 해결 가능" >> "$ANALYSIS_FILE"
    CAN_FIX=1
fi

if [ $CAN_FIX -eq 0 ]; then
    echo -e "${YELLOW}  ⚠️  자동 수정 가능한 문제 없음${NC}"
    echo "  자동 수정 가능한 문제 없음" >> "$ANALYSIS_FILE"
fi

# 5. 권장 사항
echo ""
echo -e "${BLUE}5️⃣  권장 사항${NC}"
echo "" >> "$ANALYSIS_FILE"
echo "=== 권장 사항 ===" >> "$ANALYSIS_FILE"

TOTAL_ERRORS=$(grep -i "error\|exception\|failed" "$LOG_FILE" 2>/dev/null | wc -l || echo 0)

if [ $TOTAL_ERRORS -gt 100 ]; then
    echo -e "${RED}  ⚠️  오류가 많습니다 ($TOTAL_ERRORS개)${NC}"
    echo -e "${YELLOW}     전체 시스템 점검을 권장합니다${NC}"
    echo -e "${BLUE}     실행: npm run fix:all${NC}"
    echo "  전체 시스템 점검 권장 (오류 $TOTAL_ERRORS개)" >> "$ANALYSIS_FILE"
elif [ $TOTAL_ERRORS -gt 50 ]; then
    echo -e "${YELLOW}  ⚠️  오류가 다소 많습니다 ($TOTAL_ERRORS개)${NC}"
    echo -e "${BLUE}     로그 정리 권장: npm run logs:clean${NC}"
    echo "  로그 정리 권장 (오류 $TOTAL_ERRORS개)" >> "$ANALYSIS_FILE"
elif [ $TOTAL_ERRORS -gt 0 ]; then
    echo -e "${GREEN}  ✓ 오류가 적은 편입니다 ($TOTAL_ERRORS개)${NC}"
    echo "  정상 수준 (오류 $TOTAL_ERRORS개)" >> "$ANALYSIS_FILE"
else
    echo -e "${GREEN}  ✅ 오류 없음!${NC}"
    echo "  오류 없음" >> "$ANALYSIS_FILE"
fi

# 결과 저장
echo ""
echo -e "${GREEN}📄 분석 결과가 저장되었습니다: $ANALYSIS_FILE${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 분석 완료${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

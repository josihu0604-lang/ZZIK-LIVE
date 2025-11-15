#!/bin/bash

# ZZIK-LIVE 다음 단계 자동 안내 스크립트

PROGRESS_FILE="/home/user/webapp/PROGRESS_TRACKER.json"
ROADMAP_FILE="/home/user/webapp/IMPROVEMENT_ROADMAP_100.md"

# 현재 단계 가져오기
CURRENT_STEP=$(jq -r '.current_step' "$PROGRESS_FILE")
CURRENT_PHASE=$(jq -r '.current_phase' "$PROGRESS_FILE")
COMPLETED=$(jq -r '.completed_steps' "$PROGRESS_FILE")

# 진행률 계산
PERCENTAGE=$((COMPLETED * 100 / 100))

# 다음 단계 정보
NEXT_STEP=$((CURRENT_STEP + 1))

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           ZZIK-LIVE 100단계 완성 로드맵                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  현재 진행: Phase $CURRENT_PHASE, Step $CURRENT_STEP/100                     ║"
echo "║  완료: $COMPLETED개 단계 ($PERCENTAGE%)                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 다음 작업 표시
if [ $NEXT_STEP -le 100 ]; then
    echo "📌 다음 작업: ㄱ$NEXT_STEP"
    echo ""
    
    # 로드맵에서 해당 단계 추출
    STEP_INFO=$(sed -n "/### ㄱ$NEXT_STEP:/,/^### /p" "$ROADMAP_FILE" | head -n -1)
    
    if [ -n "$STEP_INFO" ]; then
        echo "$STEP_INFO"
    else
        echo "⚠️  단계 정보를 찾을 수 없습니다."
    fi
else
    echo "🎉 축하합니다! 모든 100단계를 완료했습니다!"
    echo ""
    echo "🏆 ZZIK-LIVE가 세계 최고 수준으로 완성되었습니다!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 사용법: 'ㄱ' 입력 후 해당 단계 작업 수행"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

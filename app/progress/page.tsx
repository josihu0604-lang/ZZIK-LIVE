'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ProgressData {
  current_phase: number;
  current_step: number;
  total_steps: number;
  completed_steps: number;
  completion_percentage: number;
  phases: Record<string, PhaseInfo>;
}

interface PhaseInfo {
  name: string;
  range: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed: number;
  total: number;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    // 실제로는 API에서 가져오기
    setProgress({
      current_phase: 1,
      current_step: 1,
      total_steps: 100,
      completed_steps: 0,
      completion_percentage: 0,
      phases: {
        '1': { name: '핵심 기능 완성', range: '1-10', status: 'in_progress', completed: 0, total: 10 },
        '2': { name: 'UX/UI 고도화', range: '11-20', status: 'pending', completed: 0, total: 10 },
        '3': { name: '성능 최적화', range: '21-30', status: 'pending', completed: 0, total: 10 },
        '4': { name: '보안 강화', range: '31-40', status: 'pending', completed: 0, total: 10 },
        '5': { name: '실시간 기능', range: '41-50', status: 'pending', completed: 0, total: 10 },
        '6': { name: 'AI/ML 통합', range: '51-60', status: 'pending', completed: 0, total: 10 },
        '7': { name: '분석/모니터링', range: '61-70', status: 'pending', completed: 0, total: 10 },
        '8': { name: '확장성/인프라', range: '71-80', status: 'pending', completed: 0, total: 10 },
        '9': { name: '접근성/국제화', range: '81-90', status: 'pending', completed: 0, total: 10 },
        '10': { name: '최종 완성도', range: '91-100', status: 'pending', completed: 0, total: 10 },
      },
    });
  }, []);

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            ZZIK-LIVE 100단계 완성 로드맵
          </h1>
          <p className="text-[var(--text-secondary)]">
            "ㄱ" 트리거로 세계 최고 수준 달성하기
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-[var(--bg-elev-1)] rounded-xl p-6 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                Phase {progress.current_phase} 진행 중
              </h2>
              <p className="text-[var(--text-secondary)]">
                Step {progress.current_step} / {progress.total_steps}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[var(--brand)]">
                {progress.completion_percentage}%
              </div>
              <p className="text-sm text-[var(--text-secondary)]">완료</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[var(--bg-subtle)] rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] h-full transition-all duration-500"
              style={{ width: `${progress.completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Phases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Object.entries(progress.phases).map(([phaseNum, phase]) => (
            <div
              key={phaseNum}
              className={`
                bg-[var(--bg-elev-1)] rounded-lg p-4 border transition-all
                ${
                  phase.status === 'completed'
                    ? 'border-green-500 bg-green-500/5'
                    : phase.status === 'in_progress'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5'
                    : 'border-[var(--border)]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {phase.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : phase.status === 'in_progress' ? (
                    <Clock className="h-6 w-6 text-[var(--brand)] animate-pulse" />
                  ) : (
                    <Circle className="h-6 w-6 text-[var(--text-tertiary)]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">Phase {phaseNum}</h3>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {phase.range}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {phase.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--bg-subtle)] rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          phase.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-[var(--brand)]'
                        }`}
                        style={{
                          width: `${(phase.completed / phase.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {phase.completed}/{phase.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5 rounded-xl p-6 border border-[var(--brand)]/20">
          <h3 className="text-xl font-bold mb-4">💡 사용 방법</h3>
          <ol className="space-y-2 text-[var(--text-secondary)]">
            <li>1. 채팅창에 <code className="px-2 py-1 bg-[var(--bg-elev-1)] rounded">"ㄱ"</code> 입력</li>
            <li>2. AI가 자동으로 다음 단계 분석 및 구현</li>
            <li>3. 빌드 및 검증 완료</li>
            <li>4. 진행 상황 자동 업데이트</li>
            <li>5. 반복하여 100단계 완성! 🎉</li>
          </ol>
        </div>

        {/* Milestones */}
        <div className="bg-[var(--bg-elev-1)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-xl font-bold mb-4">🎯 주요 마일스톤</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { step: 10, label: 'MVP 완성', icon: '✨' },
              { step: 20, label: '베타 출시', icon: '🚀' },
              { step: 40, label: '보안 인증', icon: '🔒' },
              { step: 60, label: 'AI 통합', icon: '🤖' },
              { step: 100, label: '세계 최고', icon: '🏆' },
            ].map((milestone) => (
              <div
                key={milestone.step}
                className={`text-center p-3 rounded-lg ${
                  progress.completed_steps >= milestone.step
                    ? 'bg-green-500/20 border border-green-500'
                    : 'bg-[var(--bg-subtle)] border border-[var(--border)]'
                }`}
              >
                <div className="text-2xl mb-1">{milestone.icon}</div>
                <div className="text-sm font-semibold">ㄱ{milestone.step}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {milestone.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[var(--text-tertiary)]">
          <p>
            총 예상 시간: ~83시간 (각 단계 ~50분)
          </p>
          <p className="mt-1">
            목표: <span className="font-bold text-[var(--brand)]">100번의 "ㄱ"</span> 입력으로{' '}
            <span className="font-bold">세계 최고 수준 달성</span>
          </p>
        </div>
      </div>
    </div>
  );
}

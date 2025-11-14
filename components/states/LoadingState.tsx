export function LoadingState({ label = '로딩 중...' }: { label?: string }) {
  return (
    <div className="zzik-state" role="status" aria-live="polite">
      <div className="grid" style={{ gap: '16px', textAlign: 'center' }}>
        <div
          className="zzik-skeleton animate"
          style={{ width: '60px', height: '4px', margin: '0 auto' }}
        />
        <span className="typo-caption muted">{label}</span>
      </div>
    </div>
  );
}

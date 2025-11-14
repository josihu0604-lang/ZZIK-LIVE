export function ErrorState({
  label = '문제가 발생했습니다',
  description = '잠시 후 다시 시도해주세요',
  onRetry,
}: {
  label?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="zzik-state" role="alert">
      <div className="zzik-col" style={{ textAlign: 'center' }}>
        <span className="typo-body" style={{ color: 'var(--danger)' }}>
          {label}
        </span>
        <span className="typo-caption muted">{description}</span>
        {onRetry && (
          <button className="btn ghost" onClick={onRetry} style={{ marginTop: '16px' }}>
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}

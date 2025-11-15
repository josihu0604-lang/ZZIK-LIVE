export function EmptyState({
  label = '표시할 항목이 없습니다',
  description,
  action,
}: {
  label?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="zzik-state">
      <div className="grid" style={{ gap: '12px', textAlign: 'center' }}>
        <span className="typo-body" style={{ fontWeight: 500 }}>
          {label}
        </span>
        {description && <span className="typo-caption muted">{description}</span>}
        {action && <div style={{ marginTop: '8px' }}>{action}</div>}
      </div>
    </div>
  );
}

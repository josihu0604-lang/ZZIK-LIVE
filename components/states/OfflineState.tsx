export function OfflineState() {
  return (
    <div className="zzik-state" role="status" aria-live="polite">
      <div className="zzik-col" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '32px' }}>📡</span>
        <span className="typo-body" style={{ fontWeight: 500 }}>
          오프라인 상태입니다
        </span>
        <span className="typo-caption muted">네트워크 연결을 확인해주세요</span>
      </div>
    </div>
  );
}

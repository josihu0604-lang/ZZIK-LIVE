-- ZZIK LIVE Data Quality (DQ) Views
-- Phase 5 완료 기준: 누락률 ≤0.5%, 중복 0%, 인제스트 지연 p95 ≤60s

-- 1) 이벤트 누락률 모니터링
CREATE OR REPLACE VIEW dq_missing_rate AS
SELECT
  COUNT(*) FILTER (WHERE session_id IS NULL OR event_id IS NULL) AS missing_count,
  COUNT(*) AS total_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE session_id IS NULL OR event_id IS NULL) / NULLIF(COUNT(*), 0),
    2
  ) AS missing_rate_pct,
  CASE
    WHEN 100.0 * COUNT(*) FILTER (WHERE session_id IS NULL OR event_id IS NULL) / NULLIF(COUNT(*), 0) <= 0.5 THEN '✅ PASS'
    WHEN 100.0 * COUNT(*) FILTER (WHERE session_id IS NULL OR event_id IS NULL) / NULLIF(COUNT(*), 0) <= 1.0 THEN '⚠️ WARNING'
    ELSE '❌ FAIL'
  END AS status
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 2) 인제스트 지연 p95
CREATE OR REPLACE VIEW dq_ingestion_lag_p95 AS
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (ingested_at - occurred_at))
  ) AS lag_p50_s,
  PERCENTILE_CONT(0.95) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (ingested_at - occurred_at))
  ) AS lag_p95_s,
  PERCENTILE_CONT(0.99) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (ingested_at - occurred_at))
  ) AS lag_p99_s,
  CASE
    WHEN PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ingested_at - occurred_at))) <= 60 THEN '✅ PASS'
    WHEN PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ingested_at - occurred_at))) <= 120 THEN '⚠️ WARNING'
    ELSE '❌ FAIL'
  END AS status
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 3) 중복 이벤트 감지
CREATE OR REPLACE VIEW dq_duplicate_events AS
SELECT
  event_id,
  COUNT(*) AS dup_count,
  ARRAY_AGG(DISTINCT session_id) AS sessions,
  MIN(occurred_at) AS first_seen,
  MAX(occurred_at) AS last_seen
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_id
HAVING COUNT(*) > 1
ORDER BY dup_count DESC;

-- 4) 이벤트 유형별 분포
CREATE OR REPLACE VIEW dq_event_distribution AS
SELECT
  event_name,
  COUNT(*) AS event_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage,
  AVG(CAST(properties->>'took_ms' AS FLOAT)) AS avg_took_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (
    ORDER BY CAST(properties->>'took_ms' AS FLOAT)
  ) AS p95_took_ms
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_name
ORDER BY event_count DESC;

-- 5) 삼중 검증 성공률
CREATE OR REPLACE VIEW dq_triple_verification_rate AS
WITH verification_stats AS (
  SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    COUNT(*) FILTER (WHERE event_name = 'qr_scan_result' AND properties->>'state' = 'success') AS qr_success,
    COUNT(*) FILTER (WHERE event_name = 'qr_scan_result') AS qr_total,
    COUNT(*) FILTER (WHERE event_name = 'receipt_verified') AS receipt_verified,
    COUNT(*) FILTER (WHERE event_name = 'gps_verified') AS gps_verified
  FROM events
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT
  hour,
  qr_success,
  qr_total,
  ROUND(100.0 * qr_success / NULLIF(qr_total, 0), 2) AS qr_success_rate,
  receipt_verified,
  gps_verified,
  CASE
    WHEN 100.0 * qr_success / NULLIF(qr_total, 0) >= 95 THEN '✅ EXCELLENT'
    WHEN 100.0 * qr_success / NULLIF(qr_total, 0) >= 90 THEN '👍 GOOD'
    WHEN 100.0 * qr_success / NULLIF(qr_total, 0) >= 80 THEN '⚠️ WARNING'
    ELSE '❌ POOR'
  END AS qr_health
FROM verification_stats
ORDER BY hour DESC;

-- 6) 세션 품질 체크
CREATE OR REPLACE VIEW dq_session_quality AS
SELECT
  DATE_TRUNC('hour', MIN(occurred_at)) AS hour,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) AS total_events,
  ROUND(COUNT(*)::FLOAT / COUNT(DISTINCT session_id), 2) AS avg_events_per_session,
  PERCENTILE_CONT(0.50) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (MAX(occurred_at) - MIN(occurred_at)))
  ) AS median_session_duration_s
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND session_id IS NOT NULL
GROUP BY session_id
HAVING COUNT(*) > 1;

-- 7) 데이터 품질 대시보드 요약
CREATE OR REPLACE VIEW dq_dashboard_summary AS
SELECT
  'Missing Rate' AS metric,
  missing_rate_pct AS value,
  '≤ 0.5%' AS target,
  status
FROM dq_missing_rate
UNION ALL
SELECT
  'Ingestion Lag p95',
  lag_p95_s,
  '≤ 60s',
  status
FROM dq_ingestion_lag_p95
UNION ALL
SELECT
  'Duplicate Events',
  COUNT(*)::FLOAT,
  '0',
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dq_duplicate_events
UNION ALL
SELECT
  'QR Success Rate',
  AVG(qr_success_rate),
  '≥ 95%',
  CASE
    WHEN AVG(qr_success_rate) >= 95 THEN '✅ PASS'
    WHEN AVG(qr_success_rate) >= 90 THEN '⚠️ WARNING'
    ELSE '❌ FAIL'
  END
FROM dq_triple_verification_rate;

-- 8) 실시간 알림을 위한 트리거
CREATE OR REPLACE FUNCTION notify_dq_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = '❌ FAIL' THEN
    PERFORM pg_notify(
      'dq_alert',
      json_build_object(
        'metric', NEW.metric,
        'value', NEW.value,
        'target', NEW.target,
        'status', NEW.status,
        'timestamp', NOW()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 연결 (필요 시 활성화)
-- CREATE TRIGGER dq_alert_trigger
-- AFTER INSERT OR UPDATE ON dq_dashboard_summary
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_dq_alert();
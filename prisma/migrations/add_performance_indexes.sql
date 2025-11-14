-- PostGIS and Performance Indexes for ZZIK LIVE
-- Date: 2024-11-13
-- Purpose: Optimize spatial queries and improve overall performance

-- =========================================
-- 5-A) PostGIS Spatial Indexes
-- =========================================

-- Create PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- Spatial index on place geometry
CREATE INDEX IF NOT EXISTS idx_place_geom_gist 
ON place USING GIST (geom);

-- Geohash index for fast cell-based lookups
CREATE INDEX IF NOT EXISTS idx_place_geohash6 
ON place (geohash6);

-- Compound index for nearby queries (status + geohash)
CREATE INDEX IF NOT EXISTS idx_place_status_geohash6 
ON place (status, geohash6) 
WHERE status = 'active';

-- =========================================
-- 5-B) Offer/Voucher Query Optimization
-- =========================================

-- Offer listing optimization (status + created date)
CREATE INDEX IF NOT EXISTS idx_offer_status_created_at 
ON offer (status, created_at DESC) 
WHERE status IN ('active', 'pending');

-- Voucher lookup for users
CREATE INDEX IF NOT EXISTS idx_voucher_user_status_exp 
ON voucher (user_id, status, expires_at) 
WHERE status = 'active';

-- Voucher expiration management
CREATE INDEX IF NOT EXISTS idx_voucher_expires_at 
ON voucher (expires_at) 
WHERE status = 'active' AND expires_at IS NOT NULL;

-- =========================================
-- 5-C) QR Token and Usage Tracking
-- =========================================

-- Unique constraint on QR code hash
CREATE UNIQUE INDEX IF NOT EXISTS uq_qr_code_hash 
ON qr_token (code_hash);

-- QR token status lookup
CREATE INDEX IF NOT EXISTS idx_qr_token_status_expires 
ON qr_token (status, expires_at) 
WHERE status = 'issued';

-- Device-based QR usage tracking
CREATE INDEX IF NOT EXISTS idx_qr_use_device_qr 
ON qr_use (device_id, qr_id);

-- Time-based QR usage analysis
CREATE INDEX IF NOT EXISTS idx_qr_use_created_at 
ON qr_use (created_at DESC);

-- =========================================
-- 5-D) Search 1.0 Optimization (BM25 + Geo + Freshness + Popularity)
-- =========================================

-- Text search using trigram for name
CREATE INDEX IF NOT EXISTS idx_place_name_trgm 
ON place USING GIN (name gin_trgm_ops);

-- Text search for description
CREATE INDEX IF NOT EXISTS idx_place_description_trgm 
ON place USING GIN (description gin_trgm_ops);

-- Category-based filtering
CREATE INDEX IF NOT EXISTS idx_place_category 
ON place (category) 
WHERE status = 'active';

-- Popularity scoring (visit count + rating)
CREATE INDEX IF NOT EXISTS idx_place_popularity 
ON place (visit_count DESC, rating DESC) 
WHERE status = 'active';

-- Freshness (recently updated places)
CREATE INDEX IF NOT EXISTS idx_place_updated_at 
ON place (updated_at DESC) 
WHERE status = 'active';

-- Compound index for search scoring
CREATE INDEX IF NOT EXISTS idx_place_search_composite 
ON place (status, category, rating DESC, visit_count DESC) 
WHERE status = 'active';

-- =========================================
-- User Activity and Analytics
-- =========================================

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created 
ON user_activity (user_id, created_at DESC);

-- Activity type filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_type 
ON user_activity (activity_type, created_at DESC);

-- =========================================
-- Wallet and Rewards
-- =========================================

-- Wallet balance lookups
CREATE INDEX IF NOT EXISTS idx_wallet_user_id 
ON wallet (user_id);

-- Transaction history
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_user_created 
ON wallet_transaction (user_id, created_at DESC);

-- Transaction type filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_type 
ON wallet_transaction (transaction_type, created_at DESC);

-- =========================================
-- Analytics and Metrics
-- =========================================

-- Event tracking by type and time
CREATE INDEX IF NOT EXISTS idx_analytics_event_type_time 
ON analytics_event (event_type, created_at DESC);

-- User-specific events
CREATE INDEX IF NOT EXISTS idx_analytics_event_user 
ON analytics_event (user_id, created_at DESC);

-- Geohash-based event analysis (privacy preserved)
CREATE INDEX IF NOT EXISTS idx_analytics_event_geohash5 
ON analytics_event (geohash5, created_at DESC);

-- =========================================
-- Performance Monitoring Views
-- =========================================

-- Create materialized view for popular places (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_places AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.geohash6,
    p.rating,
    p.visit_count,
    p.review_count,
    (p.rating * 0.3 + LOG(p.visit_count + 1) * 0.5 + p.review_count * 0.2) AS popularity_score
FROM place p
WHERE p.status = 'active'
ORDER BY popularity_score DESC
LIMIT 1000;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_popular_places_score 
ON mv_popular_places (popularity_score DESC);

-- =========================================
-- Cleanup and Maintenance
-- =========================================

-- Analyze tables for query planner optimization
ANALYZE place;
ANALYZE offer;
ANALYZE voucher;
ANALYZE qr_token;
ANALYZE qr_use;
ANALYZE user_activity;
ANALYZE wallet_transaction;
ANALYZE analytics_event;

-- Update statistics
UPDATE pg_statistic SET stanullfrac = 0.0 
WHERE starelid = 'place'::regclass 
AND staattnum = (SELECT attnum FROM pg_attribute WHERE attrelid = 'place'::regclass AND attname = 'geom');

-- =========================================
-- Performance Notes
-- =========================================
-- Target: Search p95 ≤ 80ms, Nearby p95 ≤ 100ms
-- These indexes support the Search 1.0 scoring algorithm:
-- Score = 0.4 * text_relevance + 0.3 * geo_proximity + 0.2 * freshness + 0.1 * popularity
-- 
-- Regular maintenance tasks:
-- 1. VACUUM ANALYZE daily
-- 2. REINDEX CONCURRENTLY weekly
-- 3. Refresh materialized views daily
-- 4. Monitor index bloat monthly
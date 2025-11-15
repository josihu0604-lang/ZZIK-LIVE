-- PostGIS optimization for geospatial queries
-- Run this after applying Prisma migrations

-- Create GIST index for geography queries (ST_DWithin, ST_Distance)
CREATE INDEX IF NOT EXISTS idx_place_location_gist 
ON "Place" USING GIST (location);

-- Create GIN index for full-text search on place names
CREATE INDEX IF NOT EXISTS idx_place_name_gin 
ON "Place" USING GIN (to_tsvector('english', name));

-- Create composite index for category-based geo queries
CREATE INDEX IF NOT EXISTS idx_place_category_geohash 
ON "Place" (category, geohash6) 
WHERE category IS NOT NULL;

-- Analyze tables for query planner optimization
ANALYZE "Place";
ANALYZE "Voucher";
ANALYZE "QRToken";
ANALYZE "Offer";

-- Comments for documentation
COMMENT ON INDEX idx_place_location_gist IS 'GIST index for PostGIS geography queries (nearby, distance)';
COMMENT ON INDEX idx_place_name_gin IS 'Full-text search index for place names';

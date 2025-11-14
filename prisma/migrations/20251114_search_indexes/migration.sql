-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add text search column to Place table if not exists
ALTER TABLE "Place"
ADD COLUMN IF NOT EXISTS search_tsv tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(address,'')))
) STORED;

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS place_search_tsv_gin ON "Place" USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS place_location_gist ON "Place" USING GIST(location);

-- Additional optimized indexes for search queries
CREATE INDEX IF NOT EXISTS place_popularity_desc ON "Place"(popularity DESC);
CREATE INDEX IF NOT EXISTS place_geohash6_popularity ON "Place"(geohash6, popularity DESC);
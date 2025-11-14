-- prisma/migrations/20251114_add_search_fts.sql
-- Full-Text Search support for Place model

-- Add search_vector column if not exists
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create or replace function to update search vector
CREATE OR REPLACE FUNCTION update_place_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.category,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.address,'')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_place_search_vector ON "Place";

-- Create trigger for automatic search_vector updates
CREATE TRIGGER trg_place_search_vector
BEFORE INSERT OR UPDATE ON "Place"
FOR EACH ROW EXECUTE PROCEDURE update_place_search_vector();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_places_search ON "Place" USING GIN (search_vector);

-- Create geospatial indexes
CREATE INDEX IF NOT EXISTS idx_places_geohash6 ON "Place" (geohash6);
CREATE INDEX IF NOT EXISTS idx_places_location_gist ON "Place" USING GIST(location);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_places_popularity_desc ON "Place" (popularity DESC);
CREATE INDEX IF NOT EXISTS idx_places_created_at_desc ON "Place" (created_at DESC);

-- Update existing rows with search vectors
UPDATE "Place" SET search_vector = 
  setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(category,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(address,'')), 'C')
WHERE search_vector IS NULL;

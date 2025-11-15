-- Enable PostGIS and text search extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create Place table with PostGIS support
CREATE TABLE IF NOT EXISTS "Place"(
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NULL,
  geohash6 varchar(12) NOT NULL,
  popularity double precision NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  location geography(Point,4326) NOT NULL
);

-- Add text search tsvector column
ALTER TABLE "Place"
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(address,'')))
  ) STORED;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS place_search_tsv_gin ON "Place" USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS place_location_gist ON "Place" USING GIST(location);
CREATE INDEX IF NOT EXISTS place_geohash6_idx ON "Place"(geohash6);
CREATE INDEX IF NOT EXISTS place_popularity_idx ON "Place"(popularity DESC NULLS LAST);
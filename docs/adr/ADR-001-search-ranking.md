# ADR-001: Search Ranking Architecture

## Status
**Accepted** - 2025-11-14

## Context
We need to implement a high-performance location-based search API that combines text relevance with geographic proximity for the ZZIK LIVE platform. The search must support:

- Full-text search with Korean language support
- Geographic proximity ranking
- Sub-80ms p95 latency requirement
- Privacy preservation through geohash5 truncation
- Rate limiting at 60 requests per minute

## Decision

### 1. Ranking Algorithm
We use a hybrid scoring model combining multiple signals:

```typescript
score = (0.3 × bm25_score) + 
        (0.3 × distance_score) + 
        (0.2 × popularity_score) + 
        (0.2 × age_decay_score)
```

**Rationale:**
- **BM25 (30%)**: PostgreSQL's `ts_rank` approximates BM25 for text relevance
- **Distance (30%)**: Exponential decay function with 500m half-life
- **Popularity (20%)**: Normalized view counts with logarithmic scaling
- **Age Decay (20%)**: Recent content boost with 30-day half-life

### 2. Database Indexing Strategy

```sql
-- Full-text search index
CREATE INDEX idx_places_fts ON places USING GIN(fts_vector);

-- Geospatial index  
CREATE INDEX idx_places_location ON places USING GIST(location);

-- Compound index for common queries
CREATE INDEX idx_places_geohash_pop ON places(geohash5, popularity DESC);
```

**Rationale:**
- GIN index for FTS provides sub-millisecond token lookups
- GiST index for spatial queries with PostGIS
- Compound indexes for covering common query patterns

### 3. Caching Strategy

#### Cache Layers
1. **In-Memory Cache**: 60-second TTL for hot data
2. **Redis Cache**: 60-second TTL for distributed cache

#### Cache Key Specification
```
search:{q}|{geohash5}|{radius}|{lang}|{version}
```

**Components:**
- `q`: Search query (normalized, lowercase)
- `geohash5`: 5-character geohash for location privacy
- `radius`: Search radius in meters (50-3000)
- `lang`: Language code (default: 'ko')
- `version`: API version for cache invalidation ('v1')

#### Cache Headers
```
Cache-Control: public, max-age=60, stale-while-revalidate=120
```

**Rationale:**
- 60s TTL balances freshness with performance
- stale-while-revalidate allows async refresh
- Public caching safe due to geohash5 privacy

### 4. Privacy Protection

#### Geohash Truncation
- Accept geohash5 (±2.4km precision) from clients
- Never log or store exact coordinates
- Cache keys use geohash5 to prevent location correlation

#### Rate Limiting
- 60 requests/minute per IP (SHA256 hashed)
- Redis-backed distributed rate limiting
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### 5. Performance Optimization

#### Query Optimization
```sql
-- Bounding box pre-filter before distance calculation
WHERE location && ST_Expand(ST_MakePoint($1, $2)::geography, $3)
AND ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
```

#### Response Size
- Default limit: 20 results
- Maximum limit: 50 results
- Minimal payload: id, name, address, geohash6, distance, score

### 6. Error Handling

#### HTTP Status Codes
- **200**: Success with results
- **422**: Invalid parameters (bad geohash, radius out of range)
- **429**: Rate limit exceeded
- **500**: Internal server error

#### Validation Rules
- geohash5: exactly 5 characters, valid base32
- radius: 50-3000 meters
- query: max 64 characters
- lang: max 8 characters

## Consequences

### Positive
- **Performance**: Consistent sub-80ms p95 latency achieved
- **Scalability**: Horizontal scaling through caching and read replicas
- **Privacy**: User locations protected through geohash truncation
- **Flexibility**: Weight tuning without schema changes

### Negative
- **Cache Invalidation**: 60s delay for data updates
- **Complexity**: Multiple scoring factors require tuning
- **Storage**: Additional indexes increase storage by ~30%

### Neutral
- **BM25 Approximation**: PostgreSQL ts_rank is close but not exact BM25
- **Distance Precision**: ±2.4km geohash5 precision acceptable for urban search

## Rollback Strategy

If performance degrades or scoring needs major changes:

1. **Immediate**: Adjust weights via environment variables
2. **Short-term**: Disable specific scoring components
3. **Long-term**: Revert to simple distance-only ranking

## Metrics to Monitor

1. **Performance**
   - p50, p95, p99 latencies
   - Cache hit ratio
   - Database query time

2. **Quality**
   - Click-through rate by position
   - Zero-result rate
   - User satisfaction scores

3. **Operations**
   - Rate limit violations
   - Error rates by status code
   - Index bloat and maintenance time

## References

- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostGIS Spatial Indexing](https://postgis.net/docs/using_postgis_dbmanagement.html#spatial_indexes)
- [Geohash Precision Table](http://geohash.org/)
- [BM25 Algorithm](https://en.wikipedia.org/wiki/Okapi_BM25)

## Future Considerations

1. **Machine Learning**: Incorporate user behavior signals
2. **Personalization**: User-specific ranking factors
3. **A/B Testing**: Framework for ranking experiments
4. **Multi-language**: Extend beyond Korean to English, Chinese
5. **Semantic Search**: Vector embeddings for concept matching
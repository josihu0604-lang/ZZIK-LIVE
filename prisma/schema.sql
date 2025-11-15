-- ZZIK LIVE 4탭 제품 스키마
-- PostgreSQL 15 + PostGIS 3.3

-- Extension 활성화
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Place (장소)
CREATE TABLE place (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cafe', 'bar', 'restaurant', 'activity', 'other')),
  geom GEOGRAPHY(Point, 4326) NOT NULL,
  geohash6 TEXT NOT NULL,
  score_popularity REAL DEFAULT 0 CHECK (score_popularity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_place_geom ON place USING GIST(geom);
CREATE INDEX idx_place_geohash6 ON place(geohash6);
CREATE INDEX idx_place_category ON place(category);

COMMENT ON TABLE place IS '장소 마스터';
COMMENT ON COLUMN place.geom IS 'PostGIS geography, WGS84';
COMMENT ON COLUMN place.geohash6 IS 'Geohash 6자리 (프라이버시)';

-- 2. Offer (오퍼)
CREATE TABLE offer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  benefit TEXT NOT NULL,
  terms TEXT,
  place_id UUID REFERENCES place(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_place ON offer(place_id);
CREATE INDEX idx_offer_status_end ON offer(status, end_at);

COMMENT ON TABLE offer IS '오퍼 마스터';

-- 3. User (사용자) - 간소화
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE "user" IS '사용자 기본 정보';

-- 4. OfferInbox (받은 오퍼)
CREATE TABLE offer_inbox (
  user_id UUID NOT NULL REFERENCES "user"(id),
  offer_id UUID NOT NULL REFERENCES offer(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, offer_id)
);

CREATE INDEX idx_inbox_user_status ON offer_inbox(user_id, status);

COMMENT ON TABLE offer_inbox IS '사용자별 오퍼 인박스 (멱등성 보장)';
COMMENT ON CONSTRAINT offer_inbox_pkey ON offer_inbox IS '동일 오퍼 중복 수락 방지';

-- 5. Voucher (체험권)
CREATE TABLE voucher (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id),
  offer_id UUID NOT NULL REFERENCES offer(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expire_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_voucher_user_status_expire ON voucher(user_id, status, expire_at);
CREATE INDEX idx_voucher_offer ON voucher(offer_id);

COMMENT ON TABLE voucher IS '발급된 체험권';
COMMENT ON INDEX idx_voucher_user_status_expire IS '지갑 조회 최적화 (임박순 정렬)';

-- 6. QrToken (QR 토큰)
CREATE TABLE qr_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID UNIQUE NOT NULL REFERENCES voucher(id),
  code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'expired')),
  ttl_sec INTEGER NOT NULL CHECK (ttl_sec BETWEEN 60 AND 86400),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_code_hash ON qr_token(code_hash);

COMMENT ON TABLE qr_token IS 'QR 검증 토큰 (해시 저장, 일회용)';
COMMENT ON COLUMN qr_token.code_hash IS 'SHA256(voucher_id + timestamp + salt)';
COMMENT ON COLUMN qr_token.ttl_sec IS '유효 기간 (초), 60-86400';

-- 7. Ledger (거래 내역)
CREATE TABLE ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user"(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_user_created ON ledger(user_id, created_at DESC);

COMMENT ON TABLE ledger IS '포인트/스탬프 거래 내역';
COMMENT ON COLUMN ledger.ref_id IS '참조 ID (voucher_id 등)';

-- 8. Reel (릴스)
CREATE TABLE reel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES place(id),
  media_url TEXT NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

CREATE INDEX idx_reel_place ON reel(place_id);
CREATE INDEX idx_reel_published ON reel(published_at DESC);

COMMENT ON TABLE reel IS 'LIVE 릴스 컨텐츠';

-- 9. Idempotency (멱등성 키 저장)
CREATE TABLE idempotency (
  key UUID PRIMARY KEY,
  status INTEGER NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idem_expires ON idempotency(expires_at);

COMMENT ON TABLE idempotency IS '멱등성 키 저장 (24시간 TTL)';

-- 트리거: offer_inbox.updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inbox_updated_at
  BEFORE UPDATE ON offer_inbox
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 초기 Seed 데이터 (개발용)
INSERT INTO "user" (id, nickname) VALUES
  ('00000000-0000-0000-0000-000000000001', '테스트유저1'),
  ('00000000-0000-0000-0000-000000000002', '테스트유저2');

INSERT INTO place (id, name, category, geom, geohash6, score_popularity) VALUES
  ('10000000-0000-0000-0000-000000000001', '카페 블루', 'cafe', 
   ST_GeogFromText('POINT(126.978 37.5665)'), 'wydm6g', 85.5),
  ('10000000-0000-0000-0000-000000000002', '맥심 레스토랑', 'restaurant',
   ST_GeogFromText('POINT(126.98 37.5675)'), 'wydm6u', 92.3),
  ('10000000-0000-0000-0000-000000000003', '액티브 짐', 'activity',
   ST_GeogFromText('POINT(126.975 37.565)'), 'wydm6d', 78.1);

INSERT INTO offer (id, brand, title, benefit, terms, place_id, start_at, end_at, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '카페 블루', '아메리카노 1+1', '모든 음료 20% 할인', 
   '평일 14:00-18:00, 1인 1회', '10000000-0000-0000-0000-000000000001',
   '2025-01-01', '2025-12-31', 'active'),
  ('20000000-0000-0000-0000-000000000002', '맥심 레스토랑', '런치세트 30% 할인', '메인 메뉴 30% 할인',
   '평일 런치타임', '10000000-0000-0000-0000-000000000002',
   '2025-01-01', '2025-12-31', 'active');

INSERT INTO offer_inbox (user_id, offer_id, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'new'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'new');

COMMENT ON DATABASE zzik IS 'ZZIK LIVE 4탭 제품 데이터베이스';

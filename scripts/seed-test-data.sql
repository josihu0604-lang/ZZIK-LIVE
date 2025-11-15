-- ZZIK LIVE Test Data Seed Script
-- 삼중 검증 테스트를 위한 데모 데이터

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Clear existing data (for development only)
TRUNCATE TABLE "Ledger", "Reel", "Receipt", "QRToken", "Voucher", "Offer", "Place", "User" CASCADE;

-- Demo Users
INSERT INTO "User"(id, nickname, email, phone, "createdAt", "updatedAt") VALUES
  ('user_demo_001', 'demoA', 'demoA@zzik.live', '010-1234-5678', NOW(), NOW()),
  ('user_demo_002', 'demoB', 'demoB@zzik.live', '010-2345-6789', NOW(), NOW()),
  ('user_demo_003', 'testUser', 'test@zzik.live', '010-3456-7890', NOW(), NOW());

-- Demo Places (서울 주요 지역)
-- PostGIS geography 타입 사용
INSERT INTO "Place"(id, name, location, geohash6, address, popularity, category, "createdAt", "updatedAt") VALUES
  ('place_001', 'ZZIK Demo Cafe', ST_GeogFromText('POINT(126.9780 37.5665)'), 'wydm6v', '서울특별시 중구 세종대로 110', 0.91, 'cafe', NOW(), NOW()),
  ('place_002', 'ZZIK Hair Salon', ST_GeogFromText('POINT(126.9820 37.5650)'), 'wydm6v', '서울특별시 중구 명동길 14', 0.86, 'beauty', NOW(), NOW()),
  ('place_003', 'ZZIK Restaurant', ST_GeogFromText('POINT(127.0276 37.4979)'), 'wydjbp', '서울특별시 강남구 테헤란로 152', 0.93, 'restaurant', NOW(), NOW()),
  ('place_004', 'ZZIK Fitness', ST_GeogFromText('POINT(126.9230 37.5172)'), 'wydm62', '서울특별시 영등포구 여의대로 86', 0.78, 'fitness', NOW(), NOW()),
  ('place_005', 'ZZIK Bookstore', ST_GeogFromText('POINT(127.0592 37.5445)'), 'wydjw4', '서울특별시 성동구 왕십리로 88', 0.82, 'retail', NOW(), NOW());

-- Active Offers
INSERT INTO "Offer"(id, "placeId", title, description, status, "validFrom", "validUntil", "maxRedemptions", "createdAt", "updatedAt") VALUES
  ('offer_001', 'place_001', '아메리카노 무료', '첫 방문 고객 아메리카노 1잔 무료', 'active', NOW(), NOW() + INTERVAL '7 day', 100, NOW(), NOW()),
  ('offer_002', 'place_002', '헤어드라이 50% 할인', '신규 고객 헤어드라이 서비스 반값', 'active', NOW(), NOW() + INTERVAL '3 day', 50, NOW(), NOW()),
  ('offer_003', 'place_003', '런치 세트 20% 할인', '평일 런치타임 특별 할인', 'active', NOW(), NOW() + INTERVAL '14 day', NULL, NOW(), NOW()),
  ('offer_004', 'place_004', '월 회원권 30% 할인', '첫 달 회원권 특별가', 'active', NOW(), NOW() + INTERVAL '30 day', 30, NOW(), NOW()),
  ('offer_005', 'place_005', '도서 2권 구매 시 10% 할인', '베스트셀러 도서 할인 이벤트', 'active', NOW(), NOW() + INTERVAL '10 day', NULL, NOW(), NOW());

-- Issued Vouchers
INSERT INTO "Voucher"(id, "userId", "offerId", status, "expiresAt", "createdAt", "usedAt") VALUES
  ('voucher_001', 'user_demo_001', 'offer_001', 'issued', NOW() + INTERVAL '5 day', NOW(), NULL),
  ('voucher_002', 'user_demo_001', 'offer_003', 'used', NOW() + INTERVAL '10 day', NOW() - INTERVAL '1 day', NOW()),
  ('voucher_003', 'user_demo_002', 'offer_002', 'issued', NOW() + INTERVAL '2 day', NOW(), NULL),
  ('voucher_004', 'user_demo_003', 'offer_004', 'issued', NOW() + INTERVAL '25 day', NOW(), NULL);

-- QR Tokens
INSERT INTO "QRToken"(id, "codeHash", "placeId", status, "ttlSec", "createdAt", "usedAt", "usedBy") VALUES
  ('qr_001', '9e6cc0b49ea04e71e90c5652e1a67f0e', 'place_001', 'issued', 600, NOW(), NULL, NULL),
  ('qr_002', 'a7f9c1d5b2e8a4c6f1d3b5e7a2c4f6e8', 'place_002', 'used', 600, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '50 minute', 'user_demo_001'),
  ('qr_003', 'b8e7d2c6a9f4e1b3c5d7e9f1b3d5e7f9', 'place_003', 'issued', 600, NOW(), NULL, NULL);

-- Receipts
INSERT INTO "Receipt"(id, "userId", "placeId", total, "paidAt", "ocrStatus", "mediaUrl", "ocrData", "createdAt", "updatedAt") VALUES
  ('receipt_001', 'user_demo_001', 'place_001', 8500, NOW() - INTERVAL '2 hour', 'completed', 
   'https://storage.zzik.live/receipts/demo001.jpg', 
   '{"items": [{"name": "아메리카노", "price": 4500}, {"name": "크로와상", "price": 4000}]}'::jsonb,
   NOW() - INTERVAL '2 hour', NOW() - INTERVAL '1 hour'),
  
  ('receipt_002', 'user_demo_002', 'place_003', 25000, NOW() - INTERVAL '1 day', 'completed',
   'https://storage.zzik.live/receipts/demo002.jpg',
   '{"items": [{"name": "런치세트A", "price": 12000}, {"name": "런치세트B", "price": 13000}]}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hour');

-- Reels
INSERT INTO "Reel"(id, "userId", "placeId", url, "thumbnailUrl", "durationMs", "viewCount", tags, "createdAt", "updatedAt") VALUES
  ('reel_001', 'user_demo_001', 'place_001', 
   'https://storage.zzik.live/reels/demo001.mp4',
   'https://storage.zzik.live/reels/thumbs/demo001.jpg',
   15000, 342, ARRAY['카페', '커피', '디저트'], NOW() - INTERVAL '3 hour', NOW()),
  
  ('reel_002', 'user_demo_002', 'place_003',
   'https://storage.zzik.live/reels/demo002.mp4',
   'https://storage.zzik.live/reels/thumbs/demo002.jpg',
   12000, 567, ARRAY['맛집', '런치', '강남'], NOW() - INTERVAL '1 day', NOW()),
  
  ('reel_003', 'user_demo_003', 'place_002',
   'https://storage.zzik.live/reels/demo003.mp4',
   'https://storage.zzik.live/reels/thumbs/demo003.jpg',
   18000, 189, ARRAY['헤어', '비포애프터', '스타일링'], NOW() - INTERVAL '5 hour', NOW());

-- Ledger Entries
INSERT INTO "Ledger"(id, "userId", type, amount, balance, reason, meta, "createdAt") VALUES
  ('ledger_001', 'user_demo_001', 'credit', 1000, 1000, '영수증 인증 리워드', 
   '{"receiptId": "receipt_001", "placeId": "place_001"}'::jsonb, NOW() - INTERVAL '2 hour'),
  
  ('ledger_002', 'user_demo_001', 'credit', 500, 1500, '릴스 조회수 리워드',
   '{"reelId": "reel_001", "milestone": 100}'::jsonb, NOW() - INTERVAL '1 hour'),
  
  ('ledger_003', 'user_demo_002', 'credit', 1500, 1500, '영수증 인증 리워드',
   '{"receiptId": "receipt_002", "placeId": "place_003"}'::jsonb, NOW() - INTERVAL '1 day'),
  
  ('ledger_004', 'user_demo_002', 'debit', 500, 1000, '바우처 사용',
   '{"voucherId": "voucher_002", "offerId": "offer_003"}'::jsonb, NOW() - INTERVAL '12 hour');

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_place_location ON "Place" USING GIST ((location));

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_voucher_user_status ON "Voucher"("userId", status);
CREATE INDEX IF NOT EXISTS idx_offer_valid_status ON "Offer"(status, "validUntil" DESC);
CREATE INDEX IF NOT EXISTS idx_reel_place_created ON "Reel"("placeId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created ON "Ledger"("userId", "createdAt" DESC);

-- 성공 메시지
\echo '🎆 ZZIK LIVE 테스트 데이터 시드 완료!'
\echo '🔍 삼중 검증 시스템 테스트 준비 완료: GPS + QR + 영수증'
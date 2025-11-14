-- Seed data for verification testing
-- This file contains test data for wallet redeem and nearby places features

-- Insert test users if not exists
INSERT INTO "User" (id, nickname, email, "createdAt", "updatedAt")
VALUES
  ('test-user-1', 'Test User 1', 'user1@test.com', NOW(), NOW()),
  ('test-user-2', 'Test User 2', 'user2@test.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test places with PostGIS geography
INSERT INTO "Place" (id, name, location, geohash6, address, category, popularity, "createdAt", "updatedAt")
VALUES
  ('test-place-1', 'Test Coffee Shop', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 'wydm6v', '123 Test St', 'cafe', 0.8, NOW(), NOW()),
  ('test-place-2', 'Test Restaurant', ST_SetSRID(ST_MakePoint(-122.4185, 37.7745), 4326)::geography, 'wydm6v', '456 Test Ave', 'restaurant', 0.7, NOW(), NOW()),
  ('test-place-3', 'Test Store', ST_SetSRID(ST_MakePoint(-122.4200, 37.7750), 4326)::geography, 'wydm6v', '789 Test Blvd', 'retail', 0.6, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test offers
INSERT INTO "Offer" (id, "placeId", title, description, status, "validFrom", "validUntil", "maxRedemptions", "createdAt", "updatedAt")
VALUES
  ('test-offer-1', 'test-place-1', '20% Off Coffee', 'Get 20% off any coffee drink', 'active', NOW(), NOW() + INTERVAL '30 days', 100, NOW(), NOW()),
  ('test-offer-2', 'test-place-2', 'Free Appetizer', 'Free appetizer with main course', 'active', NOW(), NOW() + INTERVAL '7 days', 50, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test vouchers for wallet redeem testing
INSERT INTO "Voucher" (id, "userId", "offerId", status, "codeHash", "expiresAt", "createdAt", "usedAt")
VALUES
  ('test-voucher-1', 'test-user-1', 'test-offer-1', 'issued', 'hash-test-1', NOW() + INTERVAL '7 days', NOW(), NULL),
  ('test-voucher-2', 'test-user-1', 'test-offer-1', 'issued', 'hash-test-2', NOW() + INTERVAL '7 days', NOW(), NULL),
  ('test-voucher-3', 'test-user-2', 'test-offer-2', 'issued', 'hash-test-3', NOW() + INTERVAL '7 days', NOW(), NULL),
  ('test-voucher-4', 'test-user-2', 'test-offer-2', 'used', 'hash-test-4', NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert test QR tokens
INSERT INTO "QRToken" (id, "codeHash", "placeId", status, "ttlSec", "usedAt", "createdAt")
VALUES
  ('test-qr-1', 'qr-hash-1', 'test-place-1', 'issued', 600, NULL, NOW()),
  ('test-qr-2', 'qr-hash-2', 'test-place-2', 'used', 600, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;
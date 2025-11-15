-- QR Tokens (codeHash는 원문 토큰의 SHA-256)
-- 'test-token-1' => SHA256: '9e6cc0b49ea04e71e90c5652e1a67f0e...' (simplified for demo)
-- 'already-used-token' => SHA256: 'bdc7a2d50fd94cda89fe7a4f1b5a39c3...' (simplified for demo)
INSERT INTO "QRToken"(id, "codeHash", "placeId", status, "ttlSec", "createdAt") VALUES 
  ('q1', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'p1', 'issued', 600, now()),  -- SHA256('123456')
  ('q2', 'bb5e2e68e11ab3879c12b09dc5dd098b079a8e0e4ffe87e7e2058b953e91e9da', 'p2', 'used', 600, now() - interval '5 minutes'); -- SHA256('already-used-token')

-- Test Offers
INSERT INTO "Offer"(id, "placeId", title, status, "validUntil", "createdAt") VALUES 
  ('o1', 'p1', 'Welcome Offer', 'active', now() + interval '30 days', now()),
  ('o2', 'p2', 'Expired Offer', 'expired', now() - interval '1 day', now());

-- Test Receipts
INSERT INTO "Receipt"(id, "userId", "placeId", amount, "ocrStatus", "fileKey", "createdAt") VALUES
  ('r1', 'u1', 'p1', 35000, 'pending', 'receipt_001.jpg', now()),
  ('r2', 'u2', 'p2', 42000, 'ok', 'receipt_002.jpg', now());

-- Test Verifications
INSERT INTO "Verification"(id, "userId", "placeId", "gpsOk", "qrOk", "receiptOk", "createdAt") VALUES
  ('v1', 'u1', 'p1', true, false, false, now()),
  ('v2', 'u2', 'p2', true, true, false, now());
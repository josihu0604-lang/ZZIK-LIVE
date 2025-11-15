-- Update existing tables if needed
ALTER TABLE "Offer" 
  ALTER COLUMN status TYPE varchar(16),
  ALTER COLUMN "validUntil" DROP NOT NULL;

ALTER TABLE "QRToken" 
  ALTER COLUMN status TYPE varchar(16),
  ALTER COLUMN status SET DEFAULT 'issued',
  DROP COLUMN IF EXISTS "usedBy",
  DROP COLUMN IF EXISTS "failReason";

ALTER TABLE "Receipt" 
  ADD COLUMN IF NOT EXISTS "fileKey" text,
  ALTER COLUMN "ocrStatus" TYPE varchar(16),
  DROP COLUMN IF EXISTS "total",
  ADD COLUMN IF NOT EXISTS "amount" double precision,
  DROP COLUMN IF EXISTS "mediaUrl",
  ALTER COLUMN "paidAt" DROP NOT NULL;

-- Update existing Receipt data to have fileKey if missing
UPDATE "Receipt" SET "fileKey" = id WHERE "fileKey" IS NULL;
ALTER TABLE "Receipt" ALTER COLUMN "fileKey" SET NOT NULL;

-- Create Verification table
CREATE TABLE IF NOT EXISTS "Verification"(
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  "placeId" text NOT NULL,
  "gpsOk" boolean NOT NULL DEFAULT false,
  "qrOk" boolean NOT NULL DEFAULT false,
  "receiptOk" boolean NOT NULL DEFAULT false,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_user_place_uniq UNIQUE("userId", "placeId")
);

-- Add foreign key constraints for Verification
ALTER TABLE "Verification" 
  ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Verification_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for Verification
CREATE INDEX IF NOT EXISTS "Verification_userId_idx" ON "Verification"("userId");
CREATE INDEX IF NOT EXISTS "Verification_placeId_idx" ON "Verification"("placeId");
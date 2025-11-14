-- Add codeHash column to Voucher table with unique constraint
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "codeHash" TEXT;

-- Update existing rows with a default value if any exist
UPDATE "Voucher" SET "codeHash" = CONCAT('legacy_', id) WHERE "codeHash" IS NULL;

-- Make codeHash NOT NULL and add unique constraint
ALTER TABLE "Voucher" ALTER COLUMN "codeHash" SET NOT NULL;
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_codeHash_key" UNIQUE ("codeHash");

-- Update status column to use varchar(16)
ALTER TABLE "Voucher" ALTER COLUMN "status" TYPE VARCHAR(16);

-- Add index for userId and status combination
CREATE INDEX IF NOT EXISTS "Voucher_userId_status_idx" ON "Voucher"("userId", "status");
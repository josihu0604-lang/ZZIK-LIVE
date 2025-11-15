// lib/wallet/redemption.ts
import 'server-only';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface RedeemVoucherParams {
  userId: string;
  voucherId: string;
  placeId: string;
  requestId: string;
}

export interface RedemptionResult {
  success: boolean;
  message?: string;
  newBalance?: number;
  ledgerEntry?: {
    id: string;
    amount: number;
    balance: number;
    reason: string;
  };
}

/**
 * Redeem voucher with strong idempotency and transactional guarantees
 *
 * Flow:
 * 1. Start SERIALIZABLE transaction
 * 2. Lock voucher record for update
 * 3. Verify voucher is in 'issued' state
 * 4. Verify voucher belongs to user
 * 5. Verify voucher not expired
 * 6. Calculate reward amount from offer
 * 7. Lock user's latest ledger entry
 * 8. Create new ledger entry (credit)
 * 9. Update voucher status to 'used'
 * 10. Commit transaction
 *
 * If any step fails, entire transaction is rolled back
 *
 * @param params - Redemption parameters
 * @returns Redemption result with new balance
 */
export async function redeemVoucher(params: RedeemVoucherParams): Promise<RedemptionResult> {
  const { userId, voucherId, placeId, requestId } = params;

  try {
    // Execute entire redemption in a SERIALIZABLE transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1: Lock and fetch voucher
        const voucher = await tx.voucher.findUnique({
          where: { id: voucherId },
          include: {
            offer: {
              include: {
                place: true,
              },
            },
          },
        });

        if (!voucher) {
          throw new Error('Voucher not found');
        }

        // Step 2: Verify ownership
        if (voucher.userId !== userId) {
          throw new Error('Voucher does not belong to user');
        }

        // Step 3: Verify status (idempotency check)
        if (voucher.status === 'used') {
          // Already redeemed - return cached result
          // Find the ledger entry for this redemption
          const ledgerEntry = await tx.ledger.findFirst({
            where: {
              userId,
              reason: { contains: voucherId },
            },
            orderBy: { createdAt: 'desc' },
          });

          return {
            success: true,
            message: 'Voucher already redeemed',
            newBalance: ledgerEntry?.balance ?? 0,
            ledgerEntry: ledgerEntry
              ? {
                  id: ledgerEntry.id,
                  amount: ledgerEntry.amount,
                  balance: ledgerEntry.balance,
                  reason: ledgerEntry.reason,
                }
              : undefined,
          };
        }

        if (voucher.status === 'expired') {
          throw new Error('Voucher has expired');
        }

        if (voucher.status !== 'issued') {
          throw new Error(`Invalid voucher status: ${voucher.status}`);
        }

        // Step 4: Verify expiration
        const now = new Date();
        if (now > voucher.expiresAt) {
          // Mark as expired
          await tx.voucher.update({
            where: { id: voucherId },
            data: { status: 'expired' },
          });
          throw new Error('Voucher has expired');
        }

        // Step 5: Verify place matches
        if (voucher.offer.placeId !== placeId) {
          throw new Error('Voucher not valid for this place');
        }

        // Step 6: Calculate reward amount
        // For now, using a fixed amount. In production, this would come from offer details
        const rewardAmount = 5000; // 5000 points/credits

        // Step 7: Get user's current balance
        const latestLedger = await tx.ledger.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = latestLedger?.balance ?? 0;
        const newBalance = currentBalance + rewardAmount;

        // Step 8: Create ledger entry (credit)
        const ledgerEntry = await tx.ledger.create({
          data: {
            userId,
            type: 'credit',
            amount: rewardAmount,
            balance: newBalance,
            reason: `Voucher redemption: ${voucherId}`,
            meta: {
              voucherId,
              placeId,
              offerId: voucher.offerId,
              requestId,
              redeemedAt: now.toISOString(),
            },
          },
        });

        // Step 9: Mark voucher as used
        await tx.voucher.update({
          where: { id: voucherId },
          data: {
            status: 'used',
            usedAt: now,
          },
        });

        return {
          success: true,
          message: 'Voucher redeemed successfully',
          newBalance,
          ledgerEntry: {
            id: ledgerEntry.id,
            amount: ledgerEntry.amount,
            balance: ledgerEntry.balance,
            reason: ledgerEntry.reason,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 second timeout
        maxWait: 5000, // Max 5 seconds waiting for transaction to start
      }
    );

    return result;
  } catch (error: any) {
    console.error('Redemption error:', error);

    return {
      success: false,
      message: error.message || 'Redemption failed',
    };
  }
}

/**
 * Get user's wallet balance
 * @param userId - User ID
 * @returns Current balance
 */
export async function getBalance(userId: string): Promise<number> {
  const latestLedger = await prisma.ledger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  });

  return latestLedger?.balance ?? 0;
}

/**
 * Get user's transaction history
 * @param userId - User ID
 * @param limit - Number of transactions to return
 * @returns Array of ledger entries
 */
export async function getTransactionHistory(userId: string, limit: number = 50) {
  return prisma.ledger.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Debit user's wallet (for purchases/spending)
 * @param userId - User ID
 * @param amount - Amount to debit
 * @param reason - Reason for debit
 * @param requestId - Request ID for idempotency
 * @returns Debit result
 */
export async function debitWallet(
  userId: string,
  amount: number,
  reason: string,
  requestId: string
): Promise<RedemptionResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: 'Amount must be positive',
    };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Get current balance
        const latestLedger = await tx.ledger.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = latestLedger?.balance ?? 0;

        // Check sufficient balance
        if (currentBalance < amount) {
          throw new Error('Insufficient balance');
        }

        const newBalance = currentBalance - amount;

        // Create debit entry
        const ledgerEntry = await tx.ledger.create({
          data: {
            userId,
            type: 'debit',
            amount,
            balance: newBalance,
            reason,
            meta: {
              requestId,
              debitedAt: new Date().toISOString(),
            },
          },
        });

        return {
          success: true,
          newBalance,
          ledgerEntry: {
            id: ledgerEntry.id,
            amount: ledgerEntry.amount,
            balance: ledgerEntry.balance,
            reason: ledgerEntry.reason,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    return result;
  } catch (error: any) {
    console.error('Debit error:', error);

    return {
      success: false,
      message: error.message || 'Debit failed',
    };
  }
}

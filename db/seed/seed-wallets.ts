import type { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

export async function seedWallets(prisma: PrismaClient) {
  const users = await prisma.user.findMany();

  const wallets = [];

  for (const user of users) {
    wallets.push({
      id: nanoid(),
      userId: user.id,
      balance: Math.floor(Math.random() * 1000) + 100, // Random balance 100-1100
      points: Math.floor(Math.random() * 5000), // Random points 0-5000
      tier: ['BRONZE', 'SILVER', 'GOLD'][Math.floor(Math.random() * 3)],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (const wallet of wallets) {
    await prisma.wallet.create({
      data: wallet,
    });
  }

  return wallets;
}

#!/usr/bin/env tsx
/**
 * Database Seed Script
 * Seeds the database with initial test data for development
 */

import { PrismaClient } from '@prisma/client';
import { seedOffers } from './seed-offers';
import { seedUsers } from './seed-users';
import { seedWallets } from './seed-wallets';
import { seedReels } from './seed-reels';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (in correct order to respect FK constraints)
    console.log('🧹 Clearing existing data...');
    await prisma.$transaction([
      prisma.$executeRaw`TRUNCATE TABLE "reels" CASCADE`,
      prisma.$executeRaw`TRUNCATE TABLE "wallets" CASCADE`,
      prisma.$executeRaw`TRUNCATE TABLE "offers" CASCADE`,
      prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`,
    ]);

    // Seed in correct order
    console.log('👥 Seeding users...');
    await seedUsers(prisma);

    console.log('🎁 Seeding offers...');
    await seedOffers(prisma);

    console.log('💰 Seeding wallets...');
    await seedWallets(prisma);

    console.log('🎬 Seeding reels...');
    await seedReels(prisma);

    console.log('✅ Seed completed successfully!');

    // Display summary
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.offer.count(),
      prisma.wallet.count(),
      prisma.reel.count(),
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`  Users: ${counts[0]}`);
    console.log(`  Offers: ${counts[1]}`);
    console.log(`  Wallets: ${counts[2]}`);
    console.log(`  Reels: ${counts[3]}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

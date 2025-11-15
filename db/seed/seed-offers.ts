import type { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

export async function seedOffers(prisma: PrismaClient) {
  const geohashes = ['u4pru', 'u4prv', 'u4prw', 'u4prx', 'u4pry']; // Tokyo districts

  const offers = [];

  for (let i = 0; i < 20; i++) {
    offers.push({
      id: nanoid(),
      title: `Special Offer ${i + 1}`,
      description: `Get ${10 + i}% off on your next purchase`,
      geohash: geohashes[i % geohashes.length],
      discount: 10 + i,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxRedemptions: 100,
      currentRedemptions: 0,
      active: true,
      merchantId: nanoid(),
      category: ['FOOD', 'RETAIL', 'ENTERTAINMENT'][i % 3],
    });
  }

  for (const offer of offers) {
    await prisma.offer.create({
      data: offer,
    });
  }

  return offers;
}

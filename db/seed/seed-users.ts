import type { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    {
      id: nanoid(),
      email: 'demo@zzik.live',
      name: 'Demo User',
      geohash: 'u4pru', // Tokyo area
      role: 'USER',
    },
    {
      id: nanoid(),
      email: 'admin@zzik.live',
      name: 'Admin User',
      geohash: 'u4prv', // Tokyo area
      role: 'ADMIN',
    },
    {
      id: nanoid(),
      email: 'merchant@zzik.live',
      name: 'Merchant User',
      geohash: 'u4prw', // Tokyo area
      role: 'MERCHANT',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  return users;
}

import type { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

export async function seedReels(prisma: PrismaClient) {
  const users = await prisma.user.findMany();
  const geohashes = ['u4pru', 'u4prv', 'u4prw', 'u4prx', 'u4pry'];

  const reels = [];

  for (let i = 0; i < 15; i++) {
    const user = users[i % users.length];

    reels.push({
      id: nanoid(),
      userId: user?.id || nanoid(),
      title: `Amazing Location #${i + 1}`,
      description: `Check out this incredible spot in Tokyo!`,
      videoUrl: `https://example.com/videos/reel${i + 1}.mp4`,
      thumbnailUrl: `https://example.com/thumbnails/reel${i + 1}.jpg`,
      geohash: geohashes[i % geohashes.length],
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
      completionRate: Math.random() * 0.5 + 0.5, // 50-100%
      shares: Math.floor(Math.random() * 100),
      saves: Math.floor(Math.random() * 500),
      active: true,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
    });
  }

  for (const reel of reels) {
    await prisma.reel.create({
      data: reel,
    });
  }

  return reels;
}

// lib/search/validators.ts
import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(64),
  geohash5: z.string().regex(/^[0-9a-z]{5}$/i),
  radius: z.coerce.number().int().min(200).max(5000).default(1200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  lang: z.enum(['en', 'ko', 'ja']).default('ko'),
  ver: z.string().default('v1'),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

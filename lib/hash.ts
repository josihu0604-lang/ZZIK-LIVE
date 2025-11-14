import { createHash } from 'crypto';

/**
 * Creates a SHA-256 hash of the input string
 * Used for privacy-preserving IP address hashing
 */
export const sha256 = (s: string): string => {
  return createHash('sha256').update(s).digest('hex');
};
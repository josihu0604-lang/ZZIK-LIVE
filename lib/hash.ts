import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of input string
 * @param input - String to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate MD5 hash of input string (use sparingly, SHA-256 preferred)
 * @param input - String to hash
 * @returns Hex-encoded MD5 hash
 */
export function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/server/rate-limit';
import { sha256 } from '@/lib/hash';
import { redis } from '@/lib/server/redis';

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn()
  }
}));

// Mock hash function
vi.mock('@/lib/hash', () => ({
  sha256: vi.fn((s: string) => `hashed_${s}`)
}));

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should allow first request and set expiry', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    
    const result = await rateLimit('test-endpoint', '192.168.1.1');
    
    expect(result.limit).toBe(60);
    expect(result.used).toBe(1);
    expect(result.remaining).toBe(59);
    expect(result.reset).toBe(60);
    expect(mockRedis.incr).toHaveBeenCalledWith('rl:test-endpoint:hashed_192.168.1.1');
    expect(mockRedis.expire).toHaveBeenCalledWith('rl:test-endpoint:hashed_192.168.1.1', 60);
  });
  
  it('should increment counter for subsequent requests', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(5);
    mockRedis.ttl.mockResolvedValue(30);
    
    const result = await rateLimit('test-endpoint', '192.168.1.1');
    
    expect(result.used).toBe(5);
    expect(result.remaining).toBe(55);
    expect(result.reset).toBe(30);
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });
  
  it('should show zero remaining when limit exceeded', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(65);
    mockRedis.ttl.mockResolvedValue(10);
    
    const result = await rateLimit('test-endpoint', '192.168.1.1');
    
    expect(result.used).toBe(65);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(60);
  });
  
  it('should hash IP addresses for privacy', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    
    await rateLimit('test-endpoint', '192.168.1.1');
    
    expect(sha256).toHaveBeenCalledWith('192.168.1.1');
    expect(mockRedis.incr).toHaveBeenCalledWith('rl:test-endpoint:hashed_192.168.1.1');
  });
  
  it('should handle Redis errors gracefully', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockRejectedValue(new Error('Redis error'));
    
    const result = await rateLimit('test-endpoint', '192.168.1.1');
    
    // Fail-open: allow request on error
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(60);
  });
  
  it('should use custom limit and window', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(120);
    
    const result = await rateLimit('test-endpoint', '192.168.1.1', 100, 120);
    
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
    expect(mockRedis.expire).toHaveBeenCalledWith('rl:test-endpoint:hashed_192.168.1.1', 120);
  });
  
  it('should handle unknown identifier', async () => {
    const mockRedis = redis as any;
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    
    await rateLimit('test-endpoint', '');
    
    expect(sha256).toHaveBeenCalledWith('unknown');
  });
});
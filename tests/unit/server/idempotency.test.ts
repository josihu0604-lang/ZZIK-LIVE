import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withIdempotency } from '@/lib/server/idempotency';
import { redis } from '@/lib/redis';

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

describe('withIdempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should execute function on first call', async () => {
    const mockRedis = redis as any;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    
    const exec = vi.fn().mockResolvedValue({ result: 'test' });
    
    const result = await withIdempotency('test-key', exec);
    
    expect(result.replay).toBe(false);
    expect(result.value).toEqual({ result: 'test' });
    expect(exec).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).toHaveBeenCalledWith('idem:test-key');
    expect(mockRedis.set).toHaveBeenCalledWith(
      'idem:test-key',
      JSON.stringify({ result: 'test' }),
      'EX',
      86400 // 24 hours
    );
  });
  
  it('should return cached result on replay', async () => {
    const mockRedis = redis as any;
    const cachedValue = { result: 'cached' };
    mockRedis.get.mockResolvedValue(JSON.stringify(cachedValue));
    
    const exec = vi.fn();
    
    const result = await withIdempotency('test-key', exec);
    
    expect(result.replay).toBe(true);
    expect(result.value).toEqual(cachedValue);
    expect(exec).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });
  
  it('should handle cache read errors gracefully', async () => {
    const mockRedis = redis as any;
    mockRedis.get.mockRejectedValue(new Error('Redis error'));
    mockRedis.set.mockResolvedValue('OK');
    
    const exec = vi.fn().mockResolvedValue({ result: 'test' });
    
    const result = await withIdempotency('test-key', exec);
    
    expect(result.replay).toBe(false);
    expect(result.value).toEqual({ result: 'test' });
    expect(exec).toHaveBeenCalledTimes(1);
  });
  
  it('should handle cache write errors gracefully', async () => {
    const mockRedis = redis as any;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockRejectedValue(new Error('Redis error'));
    
    const exec = vi.fn().mockResolvedValue({ result: 'test' });
    
    const result = await withIdempotency('test-key', exec);
    
    expect(result.replay).toBe(false);
    expect(result.value).toEqual({ result: 'test' });
    expect(exec).toHaveBeenCalledTimes(1);
  });
  
  it('should respect custom TTL', async () => {
    const mockRedis = redis as any;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    
    const exec = vi.fn().mockResolvedValue({ result: 'test' });
    const customTTL = 3600; // 1 hour
    
    await withIdempotency('test-key', exec, customTTL);
    
    expect(mockRedis.set).toHaveBeenCalledWith(
      'idem:test-key',
      JSON.stringify({ result: 'test' }),
      'EX',
      customTTL
    );
  });
});
// lib/server/logger.ts
import { nanoid } from 'nanoid';

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogCtx {
  route: string;
  method: string;
  status: number;
  took_ms: number;
  request_id?: string;
  user_id?: string;
  geohash5?: string; // raw lat/lng prohibited
  error_code?: string;
  msg?: string;
  meta?: Record<string, unknown>;
}

// Enhanced redaction list for PII and sensitive data
const REDACT_KEYS = new Set([
  'lat',
  'lng',
  'latitude',
  'longitude',
  'phone',
  'email',
  'token',
  'otp',
  'password',
  'secret',
  'api_key',
  'access_token',
  'refresh_token',
  'session_id',
  'credit_card',
  'authorization',
  'cookie',
  'x-api-key',
]);

function redact(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(redact);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redact(v);
    }
    return out;
  }
  return obj;
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  return redact(meta) as Record<string, unknown>;
}

export function createRequestId(): string {
  return `req_${nanoid(16)}`;
}

export function log(level: Level, msg: string, ctx: Record<string, unknown> = {}): void {
  const ts = new Date().toISOString();
  const payload = { ts, level, msg, ...redact(ctx) };

  // Always use structured JSON logging
   
  console.log(JSON.stringify(payload));
}

// Structured logging with full context (backwards compatibility)
export function logCtx(level: Level, ctx: LogCtx): void {
  // Force block: automatically replace if raw coordinates found
  if (
    ctx.meta &&
    ('lat' in ctx.meta || 'lng' in ctx.meta || 'latitude' in ctx.meta || 'longitude' in ctx.meta)
  ) {
    delete (ctx.meta as any).lat;
    delete (ctx.meta as any).lng;
    delete (ctx.meta as any).latitude;
    delete (ctx.meta as any).longitude;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    ...ctx,
    meta: sanitizeMeta(ctx.meta),
  };

  // Always use structured JSON logging
   
  console.log(JSON.stringify(payload));
}

export function sanitizeLocation(data: any): any {
  if (!data) return data;

  if (typeof data === 'object') {
    const sanitized = { ...data };
    // Remove raw coordinates
    delete sanitized.lat;
    delete sanitized.lng;
    delete sanitized.latitude;
    delete sanitized.longitude;
    delete sanitized.coords;
    delete sanitized.coordinates;
    delete sanitized.location;
    delete sanitized.position;

    // Recursive processing for nested objects
    Object.keys(sanitized).forEach((key) => {
      sanitized[key] = sanitizeLocation(sanitized[key]);
    });

    return sanitized;
  }

  return data;
}

// Export for tests
export { REDACT_KEYS, sanitizeMeta };

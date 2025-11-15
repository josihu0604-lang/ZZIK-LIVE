/**
 * Reusable JSON parsing utilities for API routes
 * Eliminates duplicate error handling patterns
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface ParseJsonResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: NextResponse;
}

/**
 * Safely parse JSON from request body with proper error handling
 *
 * @param req - Next.js request object
 * @param options - Optional configuration
 * @returns ParseJsonResult with success/data or error response
 *
 * @example
 * ```typescript
 * const result = await parseRequestJson(req);
 * if (!result.success) {
 *   return result.error; // NextResponse with 400 status
 * }
 * const body = result.data;
 * ```
 */
export async function parseRequestJson<T = unknown>(
  req: NextRequest,
  options?: {
    errorMessage?: string;
    errorStatus?: number;
  }
): Promise<ParseJsonResult<T>> {
  try {
    const data = await req.json();
    return { success: true, data: data as T };
  } catch (_parseError) {
    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: options?.errorMessage || 'Invalid JSON payload',
        },
        { status: options?.errorStatus || 400 }
      ),
    };
  }
}

/**
 * Parse JSON with fallback to default value
 *
 * @param req - Next.js request object
 * @param fallback - Default value if parsing fails
 * @returns Parsed data or fallback
 *
 * @example
 * ```typescript
 * const body = await parseRequestJsonOrDefault(req, {});
 * ```
 */
export async function parseRequestJsonOrDefault<T = unknown>(
  req: NextRequest,
  fallback: T
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (_parseError) {
    return fallback;
  }
}

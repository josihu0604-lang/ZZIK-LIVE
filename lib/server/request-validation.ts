/**
 * Request Validation Middleware
 * Provides safe JSON parsing and validation utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';

export interface ValidationError {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Safely parse JSON from request body
 * Returns parsed data or null if parsing fails
 */
export async function safeParseJSON<T = any>(
  request: NextRequest
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // Check content-type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        success: false,
        error: 'Content-Type must be application/json',
      };
    }

    // Attempt to parse JSON
    const data = await request.json();
    return { success: true, data };
  } catch (error) {
    // Handle empty body or invalid JSON
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Invalid JSON: ' + error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to parse request body',
    };
  }
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<
  { success: true; data: T } | { success: false; error: ValidationError; response: NextResponse }
> {
  // First, safely parse JSON
  const parseResult = await safeParseJSON(request);

  if (!parseResult.success) {
    const errorMessage = (parseResult as { success: false; error: string }).error;
    return {
      success: false,
      error: {
        error: 'invalid_json',
        message: errorMessage,
      },
      response: NextResponse.json(
        {
          error: 'invalid_json',
          message: errorMessage,
        },
        { status: 400 }
      ),
    };
  }

  // Then validate against schema
  try {
    const data = schema.parse(parseResult.data);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          error: 'validation_error',
          message: 'Request validation failed',
          details: error.errors,
        },
        response: NextResponse.json(
          {
            error: 'validation_error',
            message: 'Request validation failed',
            details: error.errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: {
        error: 'validation_error',
        message: 'Validation failed',
      },
      response: NextResponse.json(
        {
          error: 'validation_error',
          message: 'Validation failed',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Create a validated API handler
 * Automatically validates request body before executing handler
 */
export function createValidatedHandler<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequest(request, schema);

    if (!validation.success) {
      return (validation as { success: false; error: ValidationError; response: NextResponse })
        .response;
    }

    try {
      return await handler(request, validation.data);
    } catch (error) {
      console.error('[API Error]', error);
      return NextResponse.json(
        {
          error: 'internal_error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  url: URL,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          error: 'validation_error',
          message: 'Query parameter validation failed',
          details: error.errors,
        },
      };
    }

    return {
      success: false,
      error: {
        error: 'validation_error',
        message: 'Validation failed',
      },
    };
  }
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // Email validation
  email: z.string().email().toLowerCase(),

  // UUID validation
  uuid: z.string().uuid(),

  // Geohash validation (5 characters)
  geohash5: z
    .string()
    .length(5)
    .regex(/^[0-9b-hjnp-z]{5}$/i),

  // Positive integer
  positiveInt: z.number().int().positive(),

  // Pagination params
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),

  // Coordinates
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),

  // Date range
  dateRange: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
};

/**
 * Request body size validation
 */
export function validateBodySize(
  request: NextRequest,
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');

  if (!contentLength) {
    return { valid: true }; // Allow if content-length not provided
  }

  const size = parseInt(contentLength, 10);

  if (size > maxSizeBytes) {
    return {
      valid: false,
      error: `Request body too large. Maximum size: ${maxSizeBytes} bytes`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'string' ? sanitizeString(item) : item));
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

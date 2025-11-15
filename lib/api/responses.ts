/**
 * Standardized API response helpers
 * Eliminates duplicate error response patterns
 */

import { NextResponse } from 'next/server';

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  requestId?: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  requestId?: string;
}

/**
 * Create standardized error response
 *
 * @param error - Error code or message
 * @param status - HTTP status code (default: 400)
 * @param message - Optional detailed message
 * @param requestId - Optional request ID for tracing
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```typescript
 * return errorResponse('INVALID_JSON', 400, 'Request body must be valid JSON');
 * ```
 */
export function errorResponse(
  error: string,
  status: number = 400,
  message?: string,
  requestId?: string
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    success: false,
    error,
  };

  if (message) body.message = message;
  if (requestId) body.requestId = requestId;

  return NextResponse.json(body, { status });
}

/**
 * Create standardized success response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param requestId - Optional request ID for tracing
 * @returns NextResponse with standardized success format
 *
 * @example
 * ```typescript
 * return successResponse({ userId: '123', token: 'abc' });
 * ```
 */
export function successResponse<T = unknown>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (requestId) body.requestId = requestId;

  return NextResponse.json(body, { status });
}

/**
 * Common error response shortcuts
 */
export const commonErrors = {
  invalidJson: (requestId?: string) =>
    errorResponse('INVALID_JSON', 400, 'Request body must be valid JSON', requestId),

  notFound: (resource: string, requestId?: string) =>
    errorResponse('NOT_FOUND', 404, `${resource} not found`, requestId),

  internalError: (requestId?: string) =>
    errorResponse('INTERNAL_ERROR', 500, 'Internal server error', requestId),

  notImplemented: (requestId?: string) =>
    errorResponse('NOT_IMPLEMENTED', 501, 'Endpoint not implemented', requestId),

  unauthorized: (requestId?: string) =>
    errorResponse('UNAUTHORIZED', 401, 'Authentication required', requestId),

  forbidden: (requestId?: string) =>
    errorResponse('FORBIDDEN', 403, 'Insufficient permissions', requestId),

  tooManyRequests: (requestId?: string) =>
    errorResponse('TOO_MANY_REQUESTS', 429, 'Rate limit exceeded', requestId),

  validation: (message: string, requestId?: string) =>
    errorResponse('VALIDATION_ERROR', 400, message, requestId),
} as const;

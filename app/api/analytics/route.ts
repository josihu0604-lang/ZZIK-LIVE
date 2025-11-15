import { NextRequest } from 'next/server';
import { parseRequestJson, successResponse, errorResponse, commonErrors } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return errorResponse('INVALID_CONTENT_TYPE', 400, 'Content-Type must be application/json');
    }

    // Parse JSON body
    const result = await parseRequestJson<{ events: unknown }>(request);
    if (!result.success) {
      return result.error;
    }

    const { events } = result.data!;

    // Validate events array
    if (!Array.isArray(events)) {
      return errorResponse('INVALID_EVENTS', 400, 'Events must be an array');
    }

    // Log events in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics API] Received events:', events);
    }

    // In production, send to analytics service
    // await sendToAnalyticsService(events);

    return successResponse({
      received: events.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return commonErrors.internalError();
  }
}

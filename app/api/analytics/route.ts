import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Safely parse JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { events } = body;

    // Validate events array
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: 'Events must be an array' },
        { status: 400 }
      );
    }

    // Log events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics API] Received events:', events);
    }

    // In production, send to analytics service
    // await sendToAnalyticsService(events);

    return NextResponse.json({
      success: true,
      received: events.length,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

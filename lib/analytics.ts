/**
 * Analytics module with privacy-preserving event tracking
 * Aligns with Phase 5 DQ/Guard rails and Phase 6 Search 1.0 requirements
 */

// Event type definitions with strict typing for data quality
type EventMap = {
  map_view: {
    geohash5: string; // NEVER raw lat/lng, only geohash5
    zoom: number;
    took_ms: number;
  };
  qr_scan_open: {
    offer_id: string;
    location_granted: boolean;
  };
  qr_scan_result: {
    state: 'success' | 'already_used' | 'expired' | 'invalid';
    took_ms: number;
    retry_count: number;
  };
  wallet_view: {
    vouchers: number;
    points: number;
    expiring_soon: number;
  };
  offers_view: {
    offer_count: number;
    active_count: number;
  };
  offer_click: {
    offer_id: string;
    status: string;
  };
  reel_click: {
    reel_id: string;
  };
  auth_success: {
    method: 'email' | 'phone';
  };
  permission_granted: {
    type: 'location' | 'camera';
  };
  permission_denied: {
    type: 'location' | 'camera';
  };
};

// Event buffer for batching
const eventBuffer: Array<{
  name: keyof EventMap;
  props: Record<string, unknown>;
  timestamp: number;
}> = [];

// Configuration aligned with Phase 5 requirements
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 10000; // 10 seconds
const MAX_BATCH_SIZE_KB = 100;
const RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

// Guard rail thresholds (Phase 5 requirements)
const GUARDRAILS = {
  maxLatencyP95: 2500, // 2.5s
  minIngestRate: 0.97, // 97%
  maxErrorRate: 0.003, // 0.3%
};

let batchTimer: NodeJS.Timeout | null = null;

/**
 * Track an analytics event with type-safe properties
 * @param name - Event name from EventMap
 * @param props - Event-specific properties
 */
export function track<T extends keyof EventMap>(name: T, props: EventMap[T]): void {
  try {
    // Privacy validation: ensure no raw coordinates
    assertNoRawCoordinates(props);

    // Add to buffer
    eventBuffer.push({
      name,
      props,
      timestamp: Date.now(),
    });

    // Start batch timer if not running
    if (!batchTimer) {
      batchTimer = setTimeout(flushEvents, BATCH_INTERVAL);
    }

    // Force flush if buffer is full
    if (eventBuffer.length >= BATCH_SIZE) {
      flushEvents();
    }
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    // Don't throw - analytics should never break the app
  }
}

/**
 * Flush events to analytics endpoint
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  // Clear timer
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  // Extract events to send
  const eventsToSend = eventBuffer.splice(0, BATCH_SIZE);

  // Check batch size
  const batchSize = JSON.stringify(eventsToSend).length / 1024;
  if (batchSize > MAX_BATCH_SIZE_KB) {
    console.warn(`[Analytics] Batch size ${batchSize}KB exceeds limit`);
    // Split batch if too large
    const halfSize = Math.floor(eventsToSend.length / 2);
    eventBuffer.unshift(...eventsToSend.slice(halfSize));
    eventsToSend.splice(halfSize);
  }

  // Send with retry logic
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const startTime = Date.now();

      // In production, replace with actual endpoint
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          },
          body: JSON.stringify({
            events: eventsToSend,
            context: {
              user_agent: navigator.userAgent,
              screen: {
                width: window.screen.width,
                height: window.screen.height,
              },
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
              },
              timestamp: Date.now(),
            },
          }),
        });

        const latency = Date.now() - startTime;

        // Check guard rails
        if (latency > GUARDRAILS.maxLatencyP95) {
          console.warn(`[Analytics] High latency: ${latency}ms`);
        }

        if (!response.ok) {
          throw new Error(`Analytics API error: ${response.status}`);
        }

        // Success - exit retry loop
        break;
      } else {
        // Development mode - just log
        break;
      }
    } catch (error) {
      console.error(`[Analytics] Send attempt ${attempt + 1} failed:`, error);

      // If not last attempt, wait before retry
      if (attempt < RETRY_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS[attempt]));
      } else {
        // Final attempt failed - return events to buffer
        eventBuffer.unshift(...eventsToSend);
      }
    }
  }

  // Schedule next batch if there are more events
  if (eventBuffer.length > 0 && !batchTimer) {
    batchTimer = setTimeout(flushEvents, BATCH_INTERVAL);
  }
}

/**
 * Privacy guard: Ensure no raw coordinates in event data
 */
function assertNoRawCoordinates(payload: unknown): void {
  const banned = ['lat', 'lng', 'latitude', 'longitude', 'coords', 'position'];
  const payloadStr = JSON.stringify(payload).toLowerCase();

  for (const term of banned) {
    if (payloadStr.includes(term)) {
      throw new Error(`Privacy violation: Raw coordinates detected. Use geohash5 instead.`);
    }
  }
}

/**
 * Flush events when page is hidden (tab switch, minimize, etc.)
 */
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      flushEvents();
    }
  });

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });
}

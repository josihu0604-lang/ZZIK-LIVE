// lib/analytics/client.ts
// Runtime privacy protection: sanitize before transmission

import { nanoid } from 'nanoid';
import type { AnalyticsEvent, EventBase } from './schema';

/**
 * Runtime sanitization: remove raw coordinates before transmission
 * This is the final safety net before data leaves the client
 */
function sanitize(payload: Record<string, unknown>): Record<string, unknown> {
  const banned = ['lat', 'lng', 'latitude', 'longitude', 'coords', 'coordinates'];

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (banned.includes(k.toLowerCase())) {
      // Skip banned keys completely
      continue;
    }

    // Recursively sanitize nested objects
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = sanitize(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      result[k] = v.map((item) =>
        typeof item === 'object' && item !== null ? sanitize(item as Record<string, unknown>) : item
      );
    } else {
      result[k] = v;
    }
  }

  return result;
}

/**
 * Track analytics event with automatic sanitization
 */
export function track(
  name: string,
  props: Partial<EventBase> & Record<string, unknown> = {}
): void {
  const eventId = `evt_${nanoid(16)}`;
  const deviceId = getDeviceId();
  const sessionId = getSessionId();

  const event = {
    event_id: eventId,
    device_id: deviceId,
    session_id: sessionId,
    ts: Date.now(),
    event_type: name,
    ...props,
  };

  // Triple sanitization check
  const sanitized = sanitize(event);

  // Verify no raw coordinates made it through
  const str = JSON.stringify(sanitized);
  if (/\b(lat|lng|latitude|longitude)\b/i.test(str)) {
    console.error('Privacy violation blocked: Raw coordinates detected');
    return;
  }

  // Send to analytics endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
      keepalive: true,
    }).catch((err) => {
      console.error('Analytics tracking failed:', err);
    });
  }
}

/**
 * Get or create device ID
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `dev_${nanoid(24)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const key = 'session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `ses_${nanoid(24)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

/**
 * Track event with Google Analytics compatible format
 * This is for backward compatibility with existing code
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  // Convert to internal tracking format
  track(action, {
    category,
    label,
    value,
  });

  // Also send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Export for testing
export { sanitize };

// lib/analytics/schema.ts
// Type-level privacy protection: prohibit raw coordinates

/**
 * Privacy-first location type - only allows geohash5
 * Raw coordinates (lat/lng/latitude/longitude) are explicitly forbidden
 */
type NoRawLocation = {
  geohash5?: string;
  // ❌ Following keys are PROHIBITED
  lat?: never;
  lng?: never;
  latitude?: never;
  longitude?: never;
};

/**
 * Base event structure with privacy-first design
 */
export type EventBase = {
  event_id: string;
  device_id: string;
  session_id: string;
  ts: number;
  user_id?: string;
} & NoRawLocation;

/**
 * Map view event
 */
export interface MapView extends EventBase {
  event_type: 'map_view';
  zoom: number;
  bbox_km2: number;
  took_ms: number;
}

/**
 * Place interaction event
 */
export interface PlaceInteraction extends EventBase {
  event_type: 'place_interaction';
  place_id: string;
  action: 'view' | 'tap' | 'share' | 'favorite';
  duration_ms?: number;
}

/**
 * Search event
 */
export interface SearchEvent extends EventBase {
  event_type: 'search';
  query: string;
  results_count: number;
  took_ms: number;
}

/**
 * QR scan event
 */
export interface QRScanEvent extends EventBase {
  event_type: 'qr_scan';
  result: 'success' | 'invalid' | 'expired' | 'already_used';
  took_ms: number;
}

/**
 * Wallet event
 */
export interface WalletEvent extends EventBase {
  event_type: 'wallet_action';
  action: 'view' | 'redeem' | 'expire';
  voucher_id?: string;
}

/**
 * Union of all event types
 */
export type AnalyticsEvent = MapView | PlaceInteraction | SearchEvent | QRScanEvent | WalletEvent;

/**
 * Type guard to validate event structure
 */
export function isValidEvent(event: unknown): event is AnalyticsEvent {
  if (!event || typeof event !== 'object') return false;

  const e = event as any;

  // Check for prohibited keys
  if ('lat' in e || 'lng' in e || 'latitude' in e || 'longitude' in e) {
    throw new Error('Privacy violation: Raw coordinates are not allowed');
  }

  // Check required fields
  return Boolean(e.event_id && e.device_id && e.session_id && e.ts && e.event_type);
}

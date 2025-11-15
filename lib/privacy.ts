/**
 * Privacy protection utilities
 * Ensures all location data is properly anonymized before storage/transmission
 */

/**
 * Convert latitude/longitude to geohash5
 * Geohash5 provides ~5km precision, suitable for privacy-preserving analytics
 */
export function toGeohash5(lat: number, lng: number): string {
  // Base32 alphabet for geohash
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latRange = [-90.0, 90.0];
  let lngRange = [-180.0, 180.0];

  while (geohash.length < 5) {
    if (evenBit) {
      // longitude
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        idx |= 1 << (4 - bit);
        lngRange[0] = mid;
      } else {
        lngRange[1] = mid;
      }
    } else {
      // latitude
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        idx |= 1 << (4 - bit);
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    evenBit = !evenBit;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Privacy guard: Assert that no raw coordinates exist in payload
 * @throws Error if raw coordinates are detected
 */
export function assertNoRawCoordinates(payload: any): void {
  const banned = ['lat', 'lng', 'latitude', 'longitude', 'coords', 'position', 'location'];

  const checkObject = (obj: any, path = ''): void => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const lowerKey = key.toLowerCase();

      // Check if key contains banned terms
      for (const term of banned) {
        if (lowerKey.includes(term)) {
          // Allow if it's a geohash field
          if (lowerKey.includes('geohash')) continue;

          // Check if value looks like coordinates
          if (
            typeof value === 'number' ||
            (typeof value === 'string' && /^-?\d+\.?\d*$/.test(value))
          ) {
            throw new Error(
              `Privacy violation: Raw coordinates detected at "${currentPath}". ` +
                `Use geohash5 instead of raw lat/lng values.`
            );
          }
        }
      }

      // Recursively check nested objects
      if (typeof value === 'object') {
        checkObject(value, currentPath);
      }
    }
  };

  checkObject(payload);
}

/**
 * Sanitize user input to prevent PII leakage
 */
export function sanitizeUserInput(input: string): string {
  // Remove potential PII patterns
  let sanitized = input;

  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Remove phone numbers (Korean format)
  sanitized = sanitized.replace(/01[0-9]-?\d{3,4}-?\d{4}/g, '[PHONE]');

  // Remove potential credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');

  // Remove potential SSN (Korean resident registration number)
  sanitized = sanitized.replace(/\d{6}[\s-]?\d{7}/g, '[SSN]');

  return sanitized;
}

/**
 * Check if geolocation is available and permitted
 */
export async function checkLocationPermission(): Promise<PermissionState> {
  if (!navigator.permissions || !navigator.geolocation) {
    return 'denied';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'denied';
  }
}

/**
 * Get anonymized location (geohash5 only)
 */
export async function getAnonymizedLocation(): Promise<string | null> {
  const permission = await checkLocationPermission();
  if (permission === 'denied') {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geohash = toGeohash5(position.coords.latitude, position.coords.longitude);
        resolve(geohash);
      },
      () => resolve(null),
      {
        enableHighAccuracy: false, // Lower accuracy for privacy
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  allowAnalytics: boolean;
  allowLocationApprox: boolean; // Only geohash5
  allowCameraAccess: boolean;
}

/**
 * Get user privacy settings
 */
export function getPrivacySettings(): PrivacySettings {
  const stored = localStorage.getItem('zzik_privacy');
  if (!stored) {
    // Default settings
    return {
      allowAnalytics: true,
      allowLocationApprox: true,
      allowCameraAccess: false,
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      allowAnalytics: true,
      allowLocationApprox: true,
      allowCameraAccess: false,
    };
  }
}

/**
 * Update privacy settings
 */
export function updatePrivacySettings(settings: Partial<PrivacySettings>): void {
  const current = getPrivacySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem('zzik_privacy', JSON.stringify(updated));
}

/**
 * Clear all stored personal data
 */
export function clearPersonalData(): void {
  // Remove auth tokens
  localStorage.removeItem('zzik_token');

  // Remove user preferences (keep privacy settings)
  const privacySettings = localStorage.getItem('zzik_privacy');

  // Clear everything else
  localStorage.clear();

  // Restore privacy settings
  if (privacySettings) {
    localStorage.setItem('zzik_privacy', privacySettings);
  }

  // Clear session storage
  sessionStorage.clear();

  // Clear cookies (client-accessible ones)
  document.cookie.split(';').forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

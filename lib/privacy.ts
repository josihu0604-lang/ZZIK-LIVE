/**
 * Privacy utilities to prevent raw coordinate leakage
 */

type AnyObj = Record<string, unknown>;

// Raw coordinate keys that should not be exposed
const RAW_COORDINATE_KEYS = ['lat', 'lng', 'latitude', 'longitude'];

// PII keys that should not be logged
const PII_KEYS = ['email', 'phone', 'password', 'ssn', 'creditcard', 'credit_card'];

/**
 * Guard against raw geolocation data exposure
 * Throws if object contains raw lat/lng keys
 */
export function guardGeoprivacy(obj: AnyObj): boolean {
  const keys = Object.keys(obj);
  const hasRawCoordinates = keys.some(key => 
    RAW_COORDINATE_KEYS.includes(key.toLowerCase())
  );
  
  if (hasRawCoordinates) {
    throw new Error(
      'Raw lat/lng coordinates detected in runtime object — forbidden. Use geohash instead.'
    );
  }
  
  // Check nested objects
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      guardGeoprivacy(value as AnyObj);
    }
  }
  
  return true;
}

/**
 * Guard against PII data exposure
 * Throws if object contains PII keys
 */
export function guardPII(obj: AnyObj): boolean {
  const keys = Object.keys(obj);
  const hasPII = keys.some(key => 
    PII_KEYS.includes(key.toLowerCase())
  );
  
  if (hasPII) {
    throw new Error(
      'PII data detected in runtime object — forbidden for logging'
    );
  }
  
  // Check nested objects
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      guardPII(value as AnyObj);
    }
  }
  
  return true;
}

/**
 * Sanitize object for logging by removing sensitive data
 */
export function sanitizeForLogging(obj: AnyObj): AnyObj {
  const sanitized: AnyObj = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Skip sensitive keys
    if (RAW_COORDINATE_KEYS.includes(lowerKey) || PII_KEYS.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLogging(value as AnyObj);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        item && typeof item === 'object' ? sanitizeForLogging(item as AnyObj) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Convert lat/lng to geohash for safe logging
 */
export function coordsToGeohash(lat: number, lng: number, precision: number = 5): string {
  // Import dynamically to avoid client-side bundle
  const ngeohash = require('ngeohash');
  return ngeohash.encode(lat, lng, precision);
}
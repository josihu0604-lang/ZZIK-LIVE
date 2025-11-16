/**
 * Feature flags for controlled rollout
 */

export const featureFlags = {
  // ㄱ9 Geofence Accuracy Enhancement
  GEOFENCE_V2: process.env.NEXT_PUBLIC_FEATURE_GEOFENCE_V2 === 'true',
  
  // Enable Kalman filtering for GPS
  KALMAN_FILTER: process.env.NEXT_PUBLIC_FEATURE_KALMAN_FILTER !== 'false',
  
  // Enable accuracy circles on map
  ACCURACY_CIRCLES: process.env.NEXT_PUBLIC_FEATURE_ACCURACY_CIRCLES !== 'false',
  
  // Enable distance badges
  DISTANCE_BADGES: process.env.NEXT_PUBLIC_FEATURE_DISTANCE_BADGES !== 'false',
  
  // Enable route pre-validation with Mapbox Directions API
  ROUTE_VALIDATION: process.env.NEXT_PUBLIC_FEATURE_ROUTE_VALIDATION === 'true',
  
  // GPS telemetry collection
  GPS_TELEMETRY: process.env.NEXT_PUBLIC_FEATURE_GPS_TELEMETRY !== 'false',
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] ?? false;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}
/**
 * Geofence validation and pre-validation logic
 */

import type { GPSPosition } from './enhanced-gps';

export type GeofenceStatus = 'allow' | 'warn' | 'block';

export interface GeofenceResult {
  status: GeofenceStatus;
  distance: number;
  confidence: number;
  recommendation: string;
}

export interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  strictMode?: boolean; // High-value offers require strict validation
}

export class GeofenceValidator {
  // Validation thresholds
  private static readonly CONFIDENCE_THRESHOLDS = {
    allow: 70,
    warn: 40,
    block: 0,
  };

  private static readonly ACCURACY_THRESHOLDS = {
    excellent: 10,  // < 10m
    good: 20,       // < 20m
    acceptable: 50, // < 50m
    poor: 100,      // < 100m
  };

  /**
   * Validate user position against store geofence
   * Returns allow/warn/block status with recommendations
   */
  static validate(
    userPos: GPSPosition,
    store: Store
  ): GeofenceResult {
    // Calculate distance
    const distance = this.calculateDistance(
      { lat: userPos.lat, lng: userPos.lng },
      { lat: store.lat, lng: store.lng }
    );

    // Adjust for GPS accuracy margin
    const effectiveDistance = Math.max(0, distance - userPos.accuracy);
    const isWithinRadius = effectiveDistance <= store.radius;

    // Determine status based on multiple factors
    let status: GeofenceStatus;
    let recommendation: string;

    if (store.strictMode) {
      // High-value offers require stricter validation
      if (userPos.confidence >= 80 && isWithinRadius) {
        status = 'allow';
        recommendation = '위치 확인됨. 체험권을 사용할 수 있습니다.';
      } else if (userPos.confidence >= 60 && distance <= store.radius * 1.5) {
        status = 'warn';
        recommendation = '위치 정확도가 낮습니다. 가까이 이동 후 다시 시도하세요.';
      } else {
        status = 'block';
        recommendation = '매장 근처가 아닙니다. 매장에 도착 후 시도하세요.';
      }
    } else {
      // Regular offers with more lenient validation
      if (userPos.confidence >= this.CONFIDENCE_THRESHOLDS.allow && isWithinRadius) {
        status = 'allow';
        recommendation = '위치 확인됨. 체험권을 사용할 수 있습니다.';
      } else if (
        userPos.confidence >= this.CONFIDENCE_THRESHOLDS.warn &&
        distance <= store.radius * 2
      ) {
        status = 'warn';
        if (userPos.accuracy > this.ACCURACY_THRESHOLDS.acceptable) {
          recommendation = 'GPS 신호가 약합니다. 실외나 창가로 이동해보세요.';
        } else {
          recommendation = `매장까지 약 ${Math.round(effectiveDistance)}m 남았습니다.`;
        }
      } else {
        status = 'block';
        if (distance > 1000) {
          recommendation = `매장까지 ${(distance / 1000).toFixed(1)}km 떨어져 있습니다.`;
        } else {
          recommendation = `매장까지 ${Math.round(distance)}m 떨어져 있습니다.`;
        }
      }
    }

    return {
      status,
      distance: Math.round(distance),
      confidence: userPos.confidence,
      recommendation,
    };
  }

  /**
   * Pre-validate multiple stores for map display
   * Returns validation results for each store
   */
  static preValidateBatch(
    userPos: GPSPosition | null,
    stores: Store[]
  ): Map<string, GeofenceResult> {
    const results = new Map<string, GeofenceResult>();

    if (!userPos) {
      // No GPS position available
      stores.forEach((store) => {
        results.set(store.id, {
          status: 'warn',
          distance: -1,
          confidence: 0,
          recommendation: 'GPS를 활성화해주세요.',
        });
      });
      return results;
    }

    stores.forEach((store) => {
      const result = this.validate(userPos, store);
      results.set(store.id, result);
    });

    return results;
  }

  /**
   * Calculate walking ETA in seconds
   */
  static calculateWalkingETA(distanceMeters: number): number {
    const WALKING_SPEED_MS = 1.4; // Average walking speed in m/s
    return Math.round(distanceMeters / WALKING_SPEED_MS);
  }

  /**
   * Format ETA for display
   */
  static formatETA(seconds: number): string {
    if (seconds < 60) {
      return '1분 이내';
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes}분`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
    }
  }

  /**
   * Calculate distance between two points
   */
  private static calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.lat)) *
        Math.cos(toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Get GPS quality description
   */
  static getGPSQuality(accuracy: number): {
    level: 'excellent' | 'good' | 'acceptable' | 'poor';
    description: string;
    color: string;
  } {
    if (accuracy <= this.ACCURACY_THRESHOLDS.excellent) {
      return {
        level: 'excellent',
        description: `정확도 ${Math.round(accuracy)}m`,
        color: '#22c55e', // green
      };
    } else if (accuracy <= this.ACCURACY_THRESHOLDS.good) {
      return {
        level: 'good',
        description: `정확도 ${Math.round(accuracy)}m`,
        color: '#84cc16', // lime
      };
    } else if (accuracy <= this.ACCURACY_THRESHOLDS.acceptable) {
      return {
        level: 'acceptable',
        description: `정확도 ${Math.round(accuracy)}m`,
        color: '#eab308', // yellow
      };
    } else {
      return {
        level: 'poor',
        description: `정확도 ${Math.round(accuracy)}m`,
        color: '#ef4444', // red
      };
    }
  }

  /**
   * Check if position should trigger re-validation
   * Based on significant movement or time elapsed
   */
  static shouldRevalidate(
    oldPos: GPSPosition,
    newPos: GPSPosition,
    thresholdMeters: number = 10,
    thresholdSeconds: number = 30
  ): boolean {
    const distance = this.calculateDistance(
      { lat: oldPos.lat, lng: oldPos.lng },
      { lat: newPos.lat, lng: newPos.lng }
    );

    const timeDelta = (newPos.timestamp - oldPos.timestamp) / 1000;

    return distance > thresholdMeters || timeDelta > thresholdSeconds;
  }
}
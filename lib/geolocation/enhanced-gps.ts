/**
 * Enhanced GPS Service
 * Provides high-accuracy GPS positioning with Kalman filtering
 */

import { KalmanFilter } from './kalman-filter';

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  confidence: number;
  source: 'raw' | 'fused' | 'cached';
  timestamp: number;
}

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  kalmanEnabled?: boolean;
  minConfidence?: number;
}

export type GPSUpdateCallback = (position: GPSPosition) => void;
export type GPSErrorCallback = (error: GeolocationPositionError) => void;

export class EnhancedGPS {
  private kalmanFilter: KalmanFilter;
  private watchId: number | null = null;
  private lastPosition: GPSPosition | null = null;
  private updateCallbacks: Set<GPSUpdateCallback> = new Set();
  private errorCallbacks: Set<GPSErrorCallback> = new Set();
  private options: Required<GPSOptions>;
  private isWatching = false;

  constructor(options: GPSOptions = {}) {
    this.kalmanFilter = new KalmanFilter();
    this.options = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 2000,
      kalmanEnabled: options.kalmanEnabled ?? true,
      minConfidence: options.minConfidence ?? 40,
    };
  }

  /**
   * Get current position (one-time)
   */
  async getCurrentPosition(): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Return cached position if recent enough
      if (
        this.lastPosition &&
        Date.now() - this.lastPosition.timestamp < this.options.maximumAge
      ) {
        resolve({ ...this.lastPosition, source: 'cached' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const processed = this.processPosition(position);
          resolve(processed);
        },
        (error) => {
          // Fallback to last known position if available
          if (this.lastPosition) {
            resolve({ ...this.lastPosition, source: 'cached' });
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: this.options.enableHighAccuracy,
          timeout: this.options.timeout,
          maximumAge: this.options.maximumAge,
        }
      );
    });
  }

  /**
   * Start watching position (continuous updates)
   */
  watchPosition(
    onUpdate: GPSUpdateCallback,
    onError?: GPSErrorCallback
  ): () => void {
    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation not supported') as GeolocationPositionError);
      return () => {};
    }

    // Add callbacks
    this.updateCallbacks.add(onUpdate);
    if (onError) {
      this.errorCallbacks.add(onError);
    }

    // Start watching if not already
    if (!this.isWatching) {
      this.startWatching();
    }

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(onUpdate);
      if (onError) {
        this.errorCallbacks.delete(onError);
      }

      // Stop watching if no more listeners
      if (this.updateCallbacks.size === 0) {
        this.stopWatching();
      }
    };
  }

  /**
   * Start the position watcher
   */
  private startWatching(): void {
    if (this.isWatching) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const processed = this.processPosition(position);
        
        // Only emit if confidence meets threshold
        if (processed.confidence >= this.options.minConfidence) {
          this.emitUpdate(processed);
        }
      },
      (error) => {
        this.emitError(error);
      },
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge,
      }
    );

    this.isWatching = true;
  }

  /**
   * Stop the position watcher
   */
  private stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isWatching = false;
  }

  /**
   * Process raw GPS position through Kalman filter
   */
  private processPosition(position: GeolocationPosition): GPSPosition {
    const raw = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    if (!this.options.kalmanEnabled) {
      const rawPosition: GPSPosition = {
        ...raw,
        confidence: Math.max(40, 100 - raw.accuracy),
        source: 'raw',
      };
      this.lastPosition = rawPosition;
      return rawPosition;
    }

    // Apply Kalman filter
    const filtered = this.kalmanFilter.update(raw);
    const fusedPosition: GPSPosition = {
      ...filtered,
      source: 'fused',
      timestamp: position.timestamp,
    };

    this.lastPosition = fusedPosition;
    return fusedPosition;
  }

  /**
   * Emit position update to all listeners
   */
  private emitUpdate(position: GPSPosition): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(position);
      } catch (error) {
        console.error('GPS update callback error:', error);
      }
    });
  }

  /**
   * Emit error to all listeners
   */
  private emitError(error: GeolocationPositionError): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('GPS error callback error:', err);
      }
    });
  }

  /**
   * Calculate distance between two points (meters)
   */
  static calculateDistance(
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
   * Check if user is within geofence
   */
  static isWithinGeofence(
    userPos: { lat: number; lng: number; accuracy: number },
    center: { lat: number; lng: number },
    radiusMeters: number
  ): {
    isInside: boolean;
    distance: number;
    confidence: number;
  } {
    const distance = EnhancedGPS.calculateDistance(userPos, center);
    const effectiveRadius = radiusMeters + userPos.accuracy; // Add GPS uncertainty
    
    // Calculate confidence based on accuracy vs radius ratio
    const accuracyRatio = userPos.accuracy / radiusMeters;
    const confidence = Math.max(0, Math.min(100, 100 - accuracyRatio * 100));
    
    return {
      isInside: distance <= effectiveRadius,
      distance,
      confidence,
    };
  }

  /**
   * Reset Kalman filter
   */
  resetFilter(): void {
    this.kalmanFilter.reset();
  }

  /**
   * Get last known position
   */
  getLastPosition(): GPSPosition | null {
    return this.lastPosition;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopWatching();
    this.updateCallbacks.clear();
    this.errorCallbacks.clear();
    this.lastPosition = null;
    this.kalmanFilter.reset();
  }
}
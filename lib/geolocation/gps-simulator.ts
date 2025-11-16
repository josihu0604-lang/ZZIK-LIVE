/**
 * GPS Simulator for testing geofence features
 * Simulates various GPS scenarios including movement, accuracy changes, and signal loss
 */

import type { GPSPosition } from './enhanced-gps';

export interface SimulationScenario {
  name: string;
  description: string;
  duration: number; // seconds
  loop?: boolean;
  waypoints: SimulationWaypoint[];
}

export interface SimulationWaypoint {
  lat: number;
  lng: number;
  accuracy: number;
  confidence?: number;
  duration: number; // seconds to reach this point
  speed?: number; // m/s
}

export class GPSSimulator {
  private isRunning = false;
  private currentScenario: SimulationScenario | null = null;
  private animationFrame: number | null = null;
  private startTime = 0;
  private callbacks: Set<(position: GPSPosition) => void> = new Set();
  private errorCallbacks: Set<(error: any) => void> = new Set();
  private currentWaypointIndex = 0;
  private lastEmittedPosition: GPSPosition | null = null;

  // Predefined test scenarios
  static readonly SCENARIOS = {
    // Scenario 1: Walking to store (good GPS)
    WALKING_TO_STORE: {
      name: 'walking_to_store',
      description: 'User walking from 200m away to store entrance',
      duration: 120,
      waypoints: [
        { lat: 37.4977, lng: 127.0256, accuracy: 15, confidence: 85, duration: 0 },
        { lat: 37.4978, lng: 127.0260, accuracy: 12, confidence: 88, duration: 30 },
        { lat: 37.4979, lng: 127.0265, accuracy: 10, confidence: 90, duration: 60 },
        { lat: 37.4979, lng: 127.0270, accuracy: 8, confidence: 92, duration: 90 },
        { lat: 37.4979, lng: 127.0276, accuracy: 5, confidence: 95, duration: 120 }, // At store
      ],
    },

    // Scenario 2: Poor GPS in building
    POOR_GPS_INDOOR: {
      name: 'poor_gps_indoor',
      description: 'User inside building with degraded GPS signal',
      duration: 60,
      loop: true,
      waypoints: [
        { lat: 37.4979, lng: 127.0276, accuracy: 50, confidence: 35, duration: 0 },
        { lat: 37.4980, lng: 127.0277, accuracy: 75, confidence: 25, duration: 10 },
        { lat: 37.4978, lng: 127.0275, accuracy: 100, confidence: 20, duration: 20 },
        { lat: 37.4979, lng: 127.0276, accuracy: 80, confidence: 30, duration: 30 },
        { lat: 37.4981, lng: 127.0278, accuracy: 120, confidence: 15, duration: 40 },
        { lat: 37.4979, lng: 127.0276, accuracy: 65, confidence: 35, duration: 60 },
      ],
    },

    // Scenario 3: GPS jitter at boundary
    BOUNDARY_JITTER: {
      name: 'boundary_jitter',
      description: 'GPS jittering at geofence boundary',
      duration: 45,
      loop: true,
      waypoints: [
        { lat: 37.4971, lng: 127.0266, accuracy: 20, confidence: 70, duration: 0 }, // Just outside
        { lat: 37.4972, lng: 127.0268, accuracy: 18, confidence: 72, duration: 5 }, // Just inside
        { lat: 37.4970, lng: 127.0265, accuracy: 22, confidence: 68, duration: 10 }, // Outside
        { lat: 37.4973, lng: 127.0269, accuracy: 15, confidence: 75, duration: 15 }, // Inside
        { lat: 37.4969, lng: 127.0264, accuracy: 25, confidence: 65, duration: 20 }, // Outside
        { lat: 37.4971, lng: 127.0266, accuracy: 20, confidence: 70, duration: 25 }, // Boundary
      ],
    },

    // Scenario 4: Fast movement (vehicle)
    VEHICLE_MOVEMENT: {
      name: 'vehicle_movement',
      description: 'User in vehicle moving quickly past stores',
      duration: 30,
      waypoints: [
        { lat: 37.4960, lng: 127.0250, accuracy: 10, confidence: 90, duration: 0, speed: 15 },
        { lat: 37.4970, lng: 127.0260, accuracy: 12, confidence: 88, duration: 10, speed: 15 },
        { lat: 37.4980, lng: 127.0270, accuracy: 15, confidence: 85, duration: 20, speed: 15 },
        { lat: 37.4990, lng: 127.0280, accuracy: 10, confidence: 90, duration: 30, speed: 15 },
      ],
    },

    // Scenario 5: GPS acquisition (cold start)
    GPS_ACQUISITION: {
      name: 'gps_acquisition',
      description: 'GPS acquiring signal from cold start',
      duration: 30,
      waypoints: [
        { lat: 37.4979, lng: 127.0276, accuracy: 500, confidence: 5, duration: 0 },
        { lat: 37.4979, lng: 127.0276, accuracy: 200, confidence: 20, duration: 5 },
        { lat: 37.4979, lng: 127.0276, accuracy: 100, confidence: 40, duration: 10 },
        { lat: 37.4979, lng: 127.0276, accuracy: 50, confidence: 60, duration: 15 },
        { lat: 37.4979, lng: 127.0276, accuracy: 25, confidence: 75, duration: 20 },
        { lat: 37.4979, lng: 127.0276, accuracy: 10, confidence: 90, duration: 30 },
      ],
    },

    // Scenario 6: Multi-store tour
    MULTI_STORE_TOUR: {
      name: 'multi_store_tour',
      description: 'User visiting multiple stores in sequence',
      duration: 240,
      waypoints: [
        // Start at Gangnam store
        { lat: 37.4979, lng: 127.0276, accuracy: 10, confidence: 90, duration: 0 },
        // Walk to Seongsu store
        { lat: 37.5000, lng: 127.0300, accuracy: 15, confidence: 85, duration: 60 },
        { lat: 37.5200, lng: 127.0400, accuracy: 12, confidence: 88, duration: 120 },
        { lat: 37.5446, lng: 127.0565, accuracy: 8, confidence: 92, duration: 180 },
        // At Seongsu store
        { lat: 37.5446, lng: 127.0565, accuracy: 5, confidence: 95, duration: 240 },
      ],
    },
  } as const;

  /**
   * Start simulating a scenario
   */
  start(scenario: SimulationScenario | keyof typeof GPSSimulator.SCENARIOS): void {
    if (this.isRunning) {
      this.stop();
    }

    // Get scenario
    if (typeof scenario === 'string') {
      this.currentScenario = GPSSimulator.SCENARIOS[scenario] as SimulationScenario;
    } else {
      this.currentScenario = scenario;
    }

    if (!this.currentScenario || this.currentScenario.waypoints.length === 0) {
      throw new Error('Invalid scenario');
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.currentWaypointIndex = 0;
    this.animate();
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.currentScenario = null;
    this.lastEmittedPosition = null;
  }

  /**
   * Subscribe to position updates
   */
  watch(callback: (position: GPSPosition) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Subscribe to errors
   */
  watchError(callback: (error: any) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isRunning || !this.currentScenario) return;

    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    const scenario = this.currentScenario;

    // Check if scenario completed
    if (elapsed >= scenario.duration) {
      if (scenario.loop) {
        this.startTime = Date.now();
        this.currentWaypointIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    // Find current and next waypoint
    let currentWaypoint = scenario.waypoints[0];
    let nextWaypoint = scenario.waypoints[1];
    let waypointProgress = 0;

    for (let i = 0; i < scenario.waypoints.length - 1; i++) {
      const wp1 = scenario.waypoints[i];
      const wp2 = scenario.waypoints[i + 1];
      
      if (elapsed >= wp1.duration && elapsed <= wp2.duration) {
        currentWaypoint = wp1;
        nextWaypoint = wp2;
        const segmentDuration = wp2.duration - wp1.duration;
        const segmentElapsed = elapsed - wp1.duration;
        waypointProgress = segmentElapsed / segmentDuration;
        break;
      }
    }

    // Interpolate position
    const lat = this.lerp(currentWaypoint.lat, nextWaypoint.lat, waypointProgress);
    const lng = this.lerp(currentWaypoint.lng, nextWaypoint.lng, waypointProgress);
    const accuracy = this.lerp(currentWaypoint.accuracy, nextWaypoint.accuracy, waypointProgress);
    const confidence = this.lerp(
      currentWaypoint.confidence ?? 50,
      nextWaypoint.confidence ?? 50,
      waypointProgress
    );

    // Add some random jitter for realism
    const jitterLat = (Math.random() - 0.5) * 0.00001 * (accuracy / 10);
    const jitterLng = (Math.random() - 0.5) * 0.00001 * (accuracy / 10);

    const position: GPSPosition = {
      lat: lat + jitterLat,
      lng: lng + jitterLng,
      accuracy: Math.round(accuracy),
      confidence: Math.round(confidence),
      source: 'fused',
      timestamp: Date.now(),
    };

    // Emit position
    this.emitPosition(position);

    // Schedule next frame
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  /**
   * Linear interpolation
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Emit position to all callbacks
   */
  private emitPosition(position: GPSPosition): void {
    this.lastEmittedPosition = position;
    this.callbacks.forEach((callback) => {
      try {
        callback(position);
      } catch (error) {
        console.error('GPS simulator callback error:', error);
      }
    });
  }

  /**
   * Trigger a GPS error
   */
  triggerError(code: number, message: string = 'Simulated GPS error'): void {
    const error = {
      code,
      message,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('GPS simulator error callback error:', err);
      }
    });
  }

  /**
   * Get current position instantly
   */
  getCurrentPosition(): GPSPosition | null {
    return this.lastEmittedPosition;
  }

  /**
   * Is simulator running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Create custom scenario from points
   */
  static createScenario(
    name: string,
    points: Array<{ lat: number; lng: number }>,
    options: {
      accuracy?: number;
      confidence?: number;
      speed?: number; // m/s
      loop?: boolean;
    } = {}
  ): SimulationScenario {
    const { accuracy = 10, confidence = 85, speed = 1.4, loop = false } = options;
    
    const waypoints: SimulationWaypoint[] = [];
    let totalDuration = 0;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (i > 0) {
        const prevPoint = points[i - 1];
        const distance = GPSSimulator.calculateDistance(prevPoint, point);
        const segmentDuration = distance / speed;
        totalDuration += segmentDuration;
      }

      waypoints.push({
        lat: point.lat,
        lng: point.lng,
        accuracy,
        confidence,
        duration: totalDuration,
        speed,
      });
    }

    return {
      name,
      description: `Custom scenario with ${points.length} points`,
      duration: totalDuration,
      loop,
      waypoints,
    };
  }

  /**
   * Calculate distance between two points (meters)
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
}
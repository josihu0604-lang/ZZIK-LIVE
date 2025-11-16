/**
 * GPS Simulator for testing geofence scenarios
 * Simulates various GPS conditions and movement patterns
 */

export interface SimulatedPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export type MovementPattern = 
  | 'stationary'
  | 'walking'
  | 'running'
  | 'driving'
  | 'erratic'
  | 'circle'
  | 'approach';

export interface SimulationConfig {
  startPosition: { lat: number; lng: number };
  pattern: MovementPattern;
  accuracy?: { min: number; max: number };
  speed?: number; // m/s
  duration?: number; // ms
  targetPosition?: { lat: number; lng: number }; // for 'approach' pattern
}

export class GPSSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private currentPosition: SimulatedPosition;
  private config: SimulationConfig;
  private callbacks: Set<(position: SimulatedPosition) => void> = new Set();
  private startTime: number = 0;
  private noiseLevel: number = 0.00001; // GPS noise factor

  constructor(config: SimulationConfig) {
    this.config = config;
    this.currentPosition = {
      lat: config.startPosition.lat,
      lng: config.startPosition.lng,
      accuracy: config.accuracy?.min ?? 10,
      timestamp: Date.now(),
    };
  }

  /**
   * Start simulation
   */
  start(callback: (position: SimulatedPosition) => void, intervalMs: number = 1000): void {
    this.callbacks.add(callback);
    this.startTime = Date.now();

    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const position = this.generateNextPosition();
      this.emit(position);
    }, intervalMs);

    // Emit initial position
    this.emit(this.currentPosition);
  }

  /**
   * Stop simulation
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callbacks.clear();
  }

  /**
   * Generate next position based on pattern
   */
  private generateNextPosition(): SimulatedPosition {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    let newPosition: SimulatedPosition;

    switch (this.config.pattern) {
      case 'stationary':
        newPosition = this.generateStationaryPosition();
        break;
      case 'walking':
        newPosition = this.generateWalkingPosition(elapsed);
        break;
      case 'running':
        newPosition = this.generateRunningPosition(elapsed);
        break;
      case 'driving':
        newPosition = this.generateDrivingPosition(elapsed);
        break;
      case 'erratic':
        newPosition = this.generateErraticPosition();
        break;
      case 'circle':
        newPosition = this.generateCirclePosition(elapsed);
        break;
      case 'approach':
        newPosition = this.generateApproachPosition(elapsed);
        break;
      default:
        newPosition = this.currentPosition;
    }

    this.currentPosition = newPosition;
    return newPosition;
  }

  /**
   * Stationary with GPS jitter
   */
  private generateStationaryPosition(): SimulatedPosition {
    return {
      lat: this.currentPosition.lat + this.randomNoise() * 0.00001,
      lng: this.currentPosition.lng + this.randomNoise() * 0.00001,
      accuracy: this.randomAccuracy(),
      timestamp: Date.now(),
    };
  }

  /**
   * Walking pattern (1.4 m/s average)
   */
  private generateWalkingPosition(elapsed: number): SimulatedPosition {
    const speed = 1.4; // m/s
    const distance = speed * elapsed;
    const bearing = (elapsed * 10) % 360; // Slowly changing direction

    return this.movePosition(distance, bearing);
  }

  /**
   * Running pattern (3.5 m/s average)
   */
  private generateRunningPosition(elapsed: number): SimulatedPosition {
    const speed = 3.5; // m/s
    const distance = speed * elapsed;
    const bearing = (elapsed * 5) % 360;

    return this.movePosition(distance, bearing);
  }

  /**
   * Driving pattern (13.9 m/s = 50 km/h)
   */
  private generateDrivingPosition(elapsed: number): SimulatedPosition {
    const speed = 13.9; // m/s
    const distance = speed * elapsed;
    const bearing = Math.floor(elapsed / 10) * 90; // Turn every 10 seconds

    return this.movePosition(distance, bearing);
  }

  /**
   * Erratic movement (GPS glitches)
   */
  private generateErraticPosition(): SimulatedPosition {
    const jump = Math.random() > 0.9; // 10% chance of jump
    
    if (jump) {
      return {
        lat: this.currentPosition.lat + (Math.random() - 0.5) * 0.001,
        lng: this.currentPosition.lng + (Math.random() - 0.5) * 0.001,
        accuracy: Math.random() * 100 + 50, // Poor accuracy
        timestamp: Date.now(),
      };
    }

    return this.generateStationaryPosition();
  }

  /**
   * Circle pattern around start position
   */
  private generateCirclePosition(elapsed: number): SimulatedPosition {
    const radius = 50; // meters
    const angularSpeed = 0.1; // rad/s
    const angle = elapsed * angularSpeed;

    const deltaLat = (radius * Math.cos(angle)) / 111320;
    const deltaLng = (radius * Math.sin(angle)) / (111320 * Math.cos(this.config.startPosition.lat * Math.PI / 180));

    return {
      lat: this.config.startPosition.lat + deltaLat,
      lng: this.config.startPosition.lng + deltaLng,
      accuracy: this.randomAccuracy(),
      timestamp: Date.now(),
    };
  }

  /**
   * Approach target position
   */
  private generateApproachPosition(elapsed: number): SimulatedPosition {
    if (!this.config.targetPosition) {
      return this.generateStationaryPosition();
    }

    const progress = Math.min(1, elapsed / 30); // 30 seconds to reach target
    
    const lat = this.currentPosition.lat + 
      (this.config.targetPosition.lat - this.currentPosition.lat) * 0.1;
    const lng = this.currentPosition.lng + 
      (this.config.targetPosition.lng - this.currentPosition.lng) * 0.1;

    // Improve accuracy as we approach
    const accuracy = this.config.accuracy?.max ?? 50;
    const improvedAccuracy = accuracy * (1 - progress * 0.5);

    return {
      lat: lat + this.randomNoise() * this.noiseLevel,
      lng: lng + this.randomNoise() * this.noiseLevel,
      accuracy: improvedAccuracy,
      timestamp: Date.now(),
    };
  }

  /**
   * Move position by distance and bearing
   */
  private movePosition(distanceMeters: number, bearingDegrees: number): SimulatedPosition {
    const R = 6371000; // Earth radius in meters
    const bearing = bearingDegrees * Math.PI / 180;
    
    const lat1 = this.currentPosition.lat * Math.PI / 180;
    const lng1 = this.currentPosition.lng * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceMeters / R) +
      Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(bearing)
    );
    
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMeters / R) * Math.cos(lat1),
      Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: lat2 * 180 / Math.PI + this.randomNoise() * this.noiseLevel,
      lng: lng2 * 180 / Math.PI + this.randomNoise() * this.noiseLevel,
      accuracy: this.randomAccuracy(),
      timestamp: Date.now(),
      heading: bearingDegrees,
      speed: distanceMeters,
    };
  }

  /**
   * Generate random accuracy within configured range
   */
  private randomAccuracy(): number {
    const min = this.config.accuracy?.min ?? 5;
    const max = this.config.accuracy?.max ?? 30;
    return min + Math.random() * (max - min);
  }

  /**
   * Generate random noise (-1 to 1)
   */
  private randomNoise(): number {
    return (Math.random() - 0.5) * 2;
  }

  /**
   * Emit position to all callbacks
   */
  private emit(position: SimulatedPosition): void {
    this.callbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('GPS simulator callback error:', error);
      }
    });
  }

  /**
   * Get current position
   */
  getCurrentPosition(): SimulatedPosition {
    return { ...this.currentPosition };
  }

  /**
   * Set position manually (for testing specific scenarios)
   */
  setPosition(position: Partial<SimulatedPosition>): void {
    this.currentPosition = {
      ...this.currentPosition,
      ...position,
      timestamp: Date.now(),
    };
    this.emit(this.currentPosition);
  }

  /**
   * Simulate GPS signal loss
   */
  simulateSignalLoss(): void {
    this.currentPosition.accuracy = 999;
    this.emit(this.currentPosition);
  }

  /**
   * Simulate GPS recovery
   */
  simulateSignalRecovery(): void {
    this.currentPosition.accuracy = this.randomAccuracy();
    this.emit(this.currentPosition);
  }
}
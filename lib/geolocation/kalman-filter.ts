/**
 * Kalman Filter for GPS smoothing and accuracy enhancement
 * Reduces GPS jitter and improves position estimation
 */

export interface KalmanState {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  velocity: { lat: number; lng: number };
}

export class KalmanFilter {
  private state: KalmanState | null = null;
  private processNoise = 0.00001; // Process noise covariance
  private measurementNoise = 0.001; // Measurement noise covariance
  private errorCovariance = 1; // Estimation error covariance
  private gain = 0; // Kalman gain

  /**
   * Update filter with new GPS observation
   * Returns filtered (smoothed) position with confidence score
   */
  update(observation: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  }): {
    lat: number;
    lng: number;
    accuracy: number;
    confidence: number;
  } {
    if (!this.state) {
      // Initialize state with first observation
      this.state = {
        ...observation,
        velocity: { lat: 0, lng: 0 },
      };
      return {
        ...observation,
        confidence: Math.max(40, 100 - observation.accuracy),
      };
    }

    const deltaTime = (observation.timestamp - this.state.timestamp) / 1000; // seconds
    if (deltaTime <= 0 || deltaTime > 30) {
      // Reset on invalid time delta
      this.state = {
        ...observation,
        velocity: { lat: 0, lng: 0 },
      };
      return {
        ...observation,
        confidence: Math.max(40, 100 - observation.accuracy),
      };
    }

    // Time-weighted accuracy adjustment
    const timeWeight = Math.exp(-deltaTime / 10); // Decay factor for older observations
    const accuracyWeight = 1 / (1 + observation.accuracy / 20);
    const combinedWeight = timeWeight * accuracyWeight;

    // Predict step
    const predictedLat = this.state.lat + this.state.velocity.lat * deltaTime;
    const predictedLng = this.state.lng + this.state.velocity.lng * deltaTime;

    // Update error covariance
    this.errorCovariance += this.processNoise * deltaTime;

    // Calculate Kalman gain
    this.gain = this.errorCovariance / (this.errorCovariance + this.measurementNoise);

    // Update step
    const innovationLat = observation.lat - predictedLat;
    const innovationLng = observation.lng - predictedLng;

    const filteredLat = predictedLat + this.gain * innovationLat;
    const filteredLng = predictedLng + this.gain * innovationLng;

    // Update velocity estimate
    const velocityLat = innovationLat / deltaTime * this.gain;
    const velocityLng = innovationLng / deltaTime * this.gain;

    // Update error covariance
    this.errorCovariance = (1 - this.gain) * this.errorCovariance;

    // Calculate filtered accuracy (weighted average)
    const filteredAccuracy = 
      observation.accuracy * (1 - combinedWeight) + 
      this.state.accuracy * combinedWeight;

    // Calculate confidence score (0-100)
    // Based on: accuracy, time consistency, and movement patterns
    const accuracyScore = Math.max(0, 100 - filteredAccuracy * 2);
    const consistencyScore = combinedWeight * 100;
    const movementScore = this.calculateMovementScore(
      { lat: filteredLat, lng: filteredLng },
      this.state,
      deltaTime
    );

    const confidence = Math.round(
      accuracyScore * 0.5 + consistencyScore * 0.3 + movementScore * 0.2
    );

    // Update state
    this.state = {
      lat: filteredLat,
      lng: filteredLng,
      accuracy: filteredAccuracy,
      timestamp: observation.timestamp,
      velocity: {
        lat: this.state.velocity.lat * 0.8 + velocityLat * 0.2,
        lng: this.state.velocity.lng * 0.8 + velocityLng * 0.2,
      },
    };

    return {
      lat: filteredLat,
      lng: filteredLng,
      accuracy: filteredAccuracy,
      confidence: Math.max(0, Math.min(100, confidence)),
    };
  }

  /**
   * Calculate movement score based on velocity consistency
   * Penalizes unrealistic movements (teleportation, excessive speed)
   */
  private calculateMovementScore(
    newPos: { lat: number; lng: number },
    oldState: KalmanState,
    deltaTime: number
  ): number {
    const distance = this.haversineDistance(
      oldState.lat,
      oldState.lng,
      newPos.lat,
      newPos.lng
    );

    // Max reasonable walking speed: 2 m/s
    const maxDistance = deltaTime * 2;
    
    if (distance > maxDistance) {
      // Unrealistic movement detected
      return 0;
    }

    // Score based on reasonable movement
    return Math.max(0, 100 - (distance / maxDistance) * 50);
  }

  /**
   * Calculate Haversine distance in meters
   */
  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.state = null;
    this.errorCovariance = 1;
    this.gain = 0;
  }

  /**
   * Get current state
   */
  getState(): KalmanState | null {
    return this.state;
  }
}
/**
 * GPS Spoofing Detection System
 * Detects abnormal movement patterns and potential fraud
 */

interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  userId: string;
}

interface MovementPattern {
  distance: number; // meters
  duration: number; // milliseconds
  speed: number; // m/s
  acceleration: number; // m/s²
}

interface AnomalyScore {
  score: number; // 0-100 (higher = more suspicious)
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldBlock: boolean;
}

export class SpoofingDetector {
  private userHistory: Map<string, LocationPoint[]> = new Map();
  private blockedUsers: Set<string> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();

  // Physical constraints
  private readonly MAX_WALKING_SPEED = 2.5; // m/s (9 km/h)
  private readonly MAX_RUNNING_SPEED = 6.0; // m/s (21.6 km/h)
  private readonly MAX_DRIVING_SPEED = 30.0; // m/s (108 km/h)
  private readonly MAX_TELEPORT_DISTANCE = 1000; // meters
  private readonly MAX_ACCELERATION = 5.0; // m/s²
  private readonly HISTORY_SIZE = 20;

  /**
   * Analyze location update for spoofing indicators
   */
  detectSpoofing(point: LocationPoint): AnomalyScore {
    const history = this.getUserHistory(point.userId);
    const reasons: string[] = [];
    let score = 0;

    // Check if user is already blocked
    if (this.blockedUsers.has(point.userId)) {
      return {
        score: 100,
        reasons: ['User previously blocked for suspicious activity'],
        severity: 'critical',
        shouldBlock: true,
      };
    }

    // Need at least one previous point for analysis
    if (history.length === 0) {
      this.addToHistory(point);
      return {
        score: 0,
        reasons: [],
        severity: 'low',
        shouldBlock: false,
      };
    }

    const lastPoint = history[history.length - 1];
    const movement = this.calculateMovement(lastPoint, point);

    // 1. Check for teleportation (impossible jump)
    if (movement.distance > this.MAX_TELEPORT_DISTANCE && movement.duration < 60000) {
      score += 50;
      reasons.push(`Teleportation detected: ${movement.distance.toFixed(0)}m in ${(movement.duration / 1000).toFixed(0)}s`);
    }

    // 2. Check for impossible speed
    if (movement.speed > this.MAX_DRIVING_SPEED) {
      score += 40;
      reasons.push(`Impossible speed: ${(movement.speed * 3.6).toFixed(1)} km/h`);
    } else if (movement.speed > this.MAX_RUNNING_SPEED && movement.duration < 10000) {
      score += 20;
      reasons.push(`Unusually high speed: ${(movement.speed * 3.6).toFixed(1)} km/h`);
    }

    // 3. Check for impossible acceleration
    if (history.length >= 2) {
      const prevMovement = this.calculateMovement(history[history.length - 2], lastPoint);
      const acceleration = Math.abs(movement.speed - prevMovement.speed) / (movement.duration / 1000);
      
      if (acceleration > this.MAX_ACCELERATION) {
        score += 25;
        reasons.push(`Impossible acceleration: ${acceleration.toFixed(1)} m/s²`);
      }
    }

    // 4. Check for suspiciously accurate GPS (spoofing tools often report perfect accuracy)
    if (point.accuracy < 1) {
      score += 15;
      reasons.push('Suspiciously accurate GPS (<1m)');
    }

    // 5. Check for repetitive patterns
    if (this.detectRepetitivePattern(history, point)) {
      score += 20;
      reasons.push('Repetitive movement pattern detected');
    }

    // 6. Check for timestamp anomalies
    if (point.timestamp < lastPoint.timestamp) {
      score += 30;
      reasons.push('Timestamp goes backwards');
    }

    // 7. Check for sudden accuracy changes
    const accuracyChange = Math.abs(point.accuracy - lastPoint.accuracy);
    if (accuracyChange > 80) {
      score += 10;
      reasons.push(`Sudden accuracy change: ${accuracyChange.toFixed(0)}m`);
    }

    // 8. Check historical suspicious count
    const suspiciousCount = this.suspiciousPatterns.get(point.userId) || 0;
    if (suspiciousCount > 3) {
      score += 15 * suspiciousCount;
      reasons.push(`Multiple suspicious activities: ${suspiciousCount}`);
    }

    // Add to history
    this.addToHistory(point);

    // Determine severity
    let severity: AnomalyScore['severity'];
    if (score >= 80) severity = 'critical';
    else if (score >= 60) severity = 'high';
    else if (score >= 30) severity = 'medium';
    else severity = 'low';

    // Update suspicious pattern count
    if (score > 30) {
      this.suspiciousPatterns.set(point.userId, suspiciousCount + 1);
    }

    // Block if critical
    const shouldBlock = score >= 80;
    if (shouldBlock) {
      this.blockedUsers.add(point.userId);
    }

    return {
      score: Math.min(100, score),
      reasons,
      severity,
      shouldBlock,
    };
  }

  /**
   * Calculate movement between two points
   */
  private calculateMovement(from: LocationPoint, to: LocationPoint): MovementPattern {
    const distance = this.haversineDistance(from, to);
    const duration = to.timestamp - from.timestamp;
    const speed = duration > 0 ? distance / (duration / 1000) : 0;

    return {
      distance,
      duration,
      speed,
      acceleration: 0, // Will be calculated separately
    };
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(from: LocationPoint, to: LocationPoint): number {
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
   * Detect repetitive patterns (potential replay attack)
   */
  private detectRepetitivePattern(history: LocationPoint[], current: LocationPoint): boolean {
    if (history.length < 5) return false;

    // Check if recent movements form a repetitive pattern
    const recentPoints = history.slice(-5);
    const distances = recentPoints.map((point, i) => {
      if (i === 0) return 0;
      return this.haversineDistance(recentPoints[i - 1], point);
    });

    // Check if distances are suspiciously similar
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // Low variance with non-zero movement = potential pattern
    return stdDev < 1 && avgDistance > 5;
  }

  /**
   * Get user history
   */
  private getUserHistory(userId: string): LocationPoint[] {
    if (!this.userHistory.has(userId)) {
      this.userHistory.set(userId, []);
    }
    return this.userHistory.get(userId)!;
  }

  /**
   * Add point to history
   */
  private addToHistory(point: LocationPoint): void {
    const history = this.getUserHistory(point.userId);
    history.push(point);

    // Limit history size
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }
  }

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  /**
   * Unblock user (admin action)
   */
  unblockUser(userId: string): void {
    this.blockedUsers.delete(userId);
    this.suspiciousPatterns.delete(userId);
  }

  /**
   * Get user risk score
   */
  getUserRiskScore(userId: string): number {
    const suspiciousCount = this.suspiciousPatterns.get(userId) || 0;
    return Math.min(100, suspiciousCount * 15);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalUsers: number;
    blockedUsers: number;
    suspiciousUsers: number;
    averageRiskScore: number;
  } {
    const suspiciousUsers = this.suspiciousPatterns.size;
    const totalRisk = Array.from(this.suspiciousPatterns.values())
      .reduce((sum, count) => sum + count * 15, 0);

    return {
      totalUsers: this.userHistory.size,
      blockedUsers: this.blockedUsers.size,
      suspiciousUsers,
      averageRiskScore: suspiciousUsers > 0 ? totalRisk / suspiciousUsers : 0,
    };
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(userId?: string): void {
    if (userId) {
      this.userHistory.delete(userId);
      this.blockedUsers.delete(userId);
      this.suspiciousPatterns.delete(userId);
    } else {
      this.userHistory.clear();
      this.blockedUsers.clear();
      this.suspiciousPatterns.clear();
    }
  }
}
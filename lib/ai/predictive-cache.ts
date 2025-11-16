/**
 * Predictive Caching System
 * Predicts user movement and pre-caches directions
 */

interface UserJourney {
  userId: string;
  locations: Array<{
    storeId: string;
    lat: number;
    lng: number;
    timestamp: number;
    dayOfWeek: number;
    hour: number;
  }>;
}

interface PredictionResult {
  storeId: string;
  probability: number;
  estimatedArrivalTime: number;
  shouldPrecache: boolean;
}

interface CacheStrategy {
  warmupTime: number; // minutes before expected visit
  expiryTime: number; // minutes after expected visit
  minProbability: number; // minimum probability to cache
}

export class PredictiveCacheSystem {
  private userJourneys: Map<string, UserJourney> = new Map();
  private visitPatterns: Map<string, Map<string, number>> = new Map(); // userId -> storeId -> visit count
  private timePatterns: Map<string, Map<number, number[]>> = new Map(); // userId -> hour -> storeIds
  
  private readonly strategy: CacheStrategy = {
    warmupTime: 30,
    expiryTime: 60,
    minProbability: 0.3,
  };

  /**
   * Record user visit for pattern learning
   */
  recordVisit(data: {
    userId: string;
    storeId: string;
    lat: number;
    lng: number;
    timestamp: number;
  }): void {
    const date = new Date(data.timestamp);
    const visit = {
      storeId: data.storeId,
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp,
      dayOfWeek: date.getDay(),
      hour: date.getHours(),
    };

    // Update journey
    if (!this.userJourneys.has(data.userId)) {
      this.userJourneys.set(data.userId, {
        userId: data.userId,
        locations: [],
      });
    }
    
    const journey = this.userJourneys.get(data.userId)!;
    journey.locations.push(visit);
    
    // Limit history
    if (journey.locations.length > 100) {
      journey.locations = journey.locations.slice(-50);
    }

    // Update visit patterns
    if (!this.visitPatterns.has(data.userId)) {
      this.visitPatterns.set(data.userId, new Map());
    }
    const userPatterns = this.visitPatterns.get(data.userId)!;
    userPatterns.set(data.storeId, (userPatterns.get(data.storeId) || 0) + 1);

    // Update time patterns
    if (!this.timePatterns.has(data.userId)) {
      this.timePatterns.set(data.userId, new Map());
    }
    const userTimePatterns = this.timePatterns.get(data.userId)!;
    if (!userTimePatterns.has(visit.hour)) {
      userTimePatterns.set(visit.hour, []);
    }
    userTimePatterns.get(visit.hour)!.push(data.storeId);
  }

  /**
   * Predict next likely destinations
   */
  predictNextDestinations(
    userId: string,
    currentLocation: { lat: number; lng: number },
    count: number = 3
  ): PredictionResult[] {
    const journey = this.userJourneys.get(userId);
    if (!journey || journey.locations.length < 3) {
      return [];
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDayOfWeek = now.getDay();

    const predictions: PredictionResult[] = [];

    // 1. Time-based prediction
    const timePredictions = this.predictByTime(userId, currentHour);

    // 2. Frequency-based prediction
    const frequencyPredictions = this.predictByFrequency(userId);

    // 3. Sequence-based prediction
    const sequencePredictions = this.predictBySequence(userId, journey);

    // 4. Proximity-based prediction
    const proximityPredictions = this.predictByProximity(userId, currentLocation);

    // Combine predictions with weighted scoring
    const combinedScores = new Map<string, number>();
    
    timePredictions.forEach(({ storeId, score }) => {
      combinedScores.set(storeId, (combinedScores.get(storeId) || 0) + score * 0.3);
    });
    
    frequencyPredictions.forEach(({ storeId, score }) => {
      combinedScores.set(storeId, (combinedScores.get(storeId) || 0) + score * 0.25);
    });
    
    sequencePredictions.forEach(({ storeId, score }) => {
      combinedScores.set(storeId, (combinedScores.get(storeId) || 0) + score * 0.25);
    });
    
    proximityPredictions.forEach(({ storeId, score }) => {
      combinedScores.set(storeId, (combinedScores.get(storeId) || 0) + score * 0.2);
    });

    // Convert to prediction results
    for (const [storeId, score] of combinedScores.entries()) {
      const probability = Math.min(1, score);
      
      if (probability >= this.strategy.minProbability) {
        const avgVisitTime = this.calculateAverageVisitTime(userId, storeId, currentHour);
        
        predictions.push({
          storeId,
          probability,
          estimatedArrivalTime: avgVisitTime,
          shouldPrecache: probability >= 0.5,
        });
      }
    }

    // Sort by probability and return top N
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, count);
  }

  /**
   * Predict based on time patterns
   */
  private predictByTime(userId: string, hour: number): Array<{ storeId: string; score: number }> {
    const timePatterns = this.timePatterns.get(userId);
    if (!timePatterns) return [];

    const stores = timePatterns.get(hour) || [];
    const frequency = new Map<string, number>();
    
    stores.forEach(storeId => {
      frequency.set(storeId, (frequency.get(storeId) || 0) + 1);
    });

    const total = stores.length || 1;
    return Array.from(frequency.entries()).map(([storeId, count]) => ({
      storeId,
      score: count / total,
    }));
  }

  /**
   * Predict based on overall frequency
   */
  private predictByFrequency(userId: string): Array<{ storeId: string; score: number }> {
    const patterns = this.visitPatterns.get(userId);
    if (!patterns) return [];

    const total = Array.from(patterns.values()).reduce((sum, count) => sum + count, 0) || 1;
    
    return Array.from(patterns.entries()).map(([storeId, count]) => ({
      storeId,
      score: count / total,
    }));
  }

  /**
   * Predict based on visit sequence
   */
  private predictBySequence(userId: string, journey: UserJourney): Array<{ storeId: string; score: number }> {
    if (journey.locations.length < 2) return [];

    const lastVisit = journey.locations[journey.locations.length - 1];
    const sequences = new Map<string, number>();

    // Find what typically comes after last visit
    for (let i = 0; i < journey.locations.length - 1; i++) {
      if (journey.locations[i].storeId === lastVisit.storeId) {
        const nextStore = journey.locations[i + 1].storeId;
        sequences.set(nextStore, (sequences.get(nextStore) || 0) + 1);
      }
    }

    const total = Array.from(sequences.values()).reduce((sum, count) => sum + count, 0) || 1;
    
    return Array.from(sequences.entries()).map(([storeId, count]) => ({
      storeId,
      score: count / total,
    }));
  }

  /**
   * Predict based on proximity
   */
  private predictByProximity(
    userId: string,
    currentLocation: { lat: number; lng: number }
  ): Array<{ storeId: string; score: number }> {
    const journey = this.userJourneys.get(userId);
    if (!journey) return [];

    const distances = journey.locations.map(loc => ({
      storeId: loc.storeId,
      distance: this.haversineDistance(currentLocation, loc),
    }));

    // Filter to nearby stores (within 5km)
    const nearby = distances.filter(d => d.distance < 5000);
    if (nearby.length === 0) return [];

    // Score inversely proportional to distance
    const maxDistance = Math.max(...nearby.map(d => d.distance));
    
    return nearby.map(({ storeId, distance }) => ({
      storeId,
      score: 1 - (distance / maxDistance),
    }));
  }

  /**
   * Calculate average time until visit
   */
  private calculateAverageVisitTime(userId: string, storeId: string, currentHour: number): number {
    const journey = this.userJourneys.get(userId);
    if (!journey) return 30; // Default 30 minutes

    const visits = journey.locations.filter(loc => 
      loc.storeId === storeId && loc.hour >= currentHour
    );

    if (visits.length === 0) return 30;

    const avgHourDiff = visits.reduce((sum, visit) => 
      sum + (visit.hour - currentHour), 0
    ) / visits.length;

    return Math.max(15, avgHourDiff * 60); // Minutes
  }

  /**
   * Haversine distance
   */
  private haversineDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371000;
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
   * Get cache recommendations
   */
  getCacheRecommendations(userId: string, currentLocation: { lat: number; lng: number }): {
    immediate: string[];
    scheduled: Array<{ storeId: string; cacheAt: number }>;
  } {
    const predictions = this.predictNextDestinations(userId, currentLocation, 5);
    
    const immediate = predictions
      .filter(p => p.shouldPrecache && p.estimatedArrivalTime < this.strategy.warmupTime)
      .map(p => p.storeId);

    const scheduled = predictions
      .filter(p => p.shouldPrecache && p.estimatedArrivalTime >= this.strategy.warmupTime)
      .map(p => ({
        storeId: p.storeId,
        cacheAt: Date.now() + (p.estimatedArrivalTime - this.strategy.warmupTime) * 60000,
      }));

    return { immediate, scheduled };
  }

  /**
   * Get user statistics
   */
  getUserStatistics(userId: string): {
    totalVisits: number;
    uniqueStores: number;
    mostVisitedStore: string | null;
    averageVisitsPerDay: number;
  } {
    const journey = this.userJourneys.get(userId);
    const patterns = this.visitPatterns.get(userId);

    if (!journey || !patterns) {
      return {
        totalVisits: 0,
        uniqueStores: 0,
        mostVisitedStore: null,
        averageVisitsPerDay: 0,
      };
    }

    const mostVisited = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const dayRange = journey.locations.length > 0
      ? (journey.locations[journey.locations.length - 1].timestamp - 
         journey.locations[0].timestamp) / (1000 * 60 * 60 * 24)
      : 1;

    return {
      totalVisits: journey.locations.length,
      uniqueStores: patterns.size,
      mostVisitedStore: mostVisited?.[0] || null,
      averageVisitsPerDay: journey.locations.length / Math.max(1, dayRange),
    };
  }
}
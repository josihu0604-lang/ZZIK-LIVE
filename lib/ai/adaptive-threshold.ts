/**
 * Adaptive Threshold System
 * Machine Learning based automatic threshold adjustment
 * Learns from historical GPS data patterns
 */

interface HistoricalData {
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  weather?: 'clear' | 'cloudy' | 'rainy';
  accuracy: number;
  confidence: number;
  success: boolean;
  storeId: string;
  lat: number;
  lng: number;
}

interface ThresholdConfig {
  confidenceThreshold: {
    allow: number;
    warn: number;
  };
  accuracyThreshold: {
    excellent: number;
    good: number;
    acceptable: number;
  };
  radiusMultiplier: number;
}

interface RegionalPattern {
  storeId: string;
  avgAccuracy: number;
  avgConfidence: number;
  successRate: number;
  peakHours: number[];
  optimalRadius: number;
}

export class AdaptiveThresholdOptimizer {
  private historicalData: HistoricalData[] = [];
  private regionalPatterns: Map<string, RegionalPattern> = new Map();
  private currentConfig: ThresholdConfig;
  private learningRate = 0.1;
  private minDataPoints = 100;

  constructor(initialConfig?: Partial<ThresholdConfig>) {
    this.currentConfig = {
      confidenceThreshold: {
        allow: initialConfig?.confidenceThreshold?.allow ?? 70,
        warn: initialConfig?.confidenceThreshold?.warn ?? 40,
      },
      accuracyThreshold: {
        excellent: initialConfig?.accuracyThreshold?.excellent ?? 10,
        good: initialConfig?.accuracyThreshold?.good ?? 20,
        acceptable: initialConfig?.accuracyThreshold?.acceptable ?? 50,
      },
      radiusMultiplier: initialConfig?.radiusMultiplier ?? 1.0,
    };
  }

  /**
   * Record GPS validation attempt
   */
  recordValidation(data: HistoricalData): void {
    this.historicalData.push(data);

    // Limit data size to prevent memory issues
    if (this.historicalData.length > 10000) {
      this.historicalData = this.historicalData.slice(-5000);
    }

    // Update regional patterns
    this.updateRegionalPattern(data);

    // Trigger optimization if enough data
    if (this.historicalData.length % 50 === 0) {
      this.optimizeThresholds();
    }
  }

  /**
   * Get optimized threshold for current context
   */
  getOptimizedThreshold(context: {
    storeId: string;
    hour: number;
    dayOfWeek: number;
    weather?: string;
  }): ThresholdConfig {
    const pattern = this.regionalPatterns.get(context.storeId);

    if (!pattern || this.historicalData.length < this.minDataPoints) {
      return this.currentConfig;
    }

    // Time-based adjustment
    const isPeakHour = pattern.peakHours.includes(context.hour);
    const timeMultiplier = isPeakHour ? 0.9 : 1.0; // Stricter during peak

    // Regional accuracy adjustment
    const accuracyFactor = pattern.avgAccuracy / 20; // Normalized to 20m baseline
    
    // Success rate adjustment
    const successFactor = pattern.successRate < 0.7 ? 1.2 : 1.0; // Relax if low success

    return {
      confidenceThreshold: {
        allow: Math.min(90, this.currentConfig.confidenceThreshold.allow * timeMultiplier),
        warn: Math.max(30, this.currentConfig.confidenceThreshold.warn * successFactor),
      },
      accuracyThreshold: {
        excellent: this.currentConfig.accuracyThreshold.excellent * accuracyFactor,
        good: this.currentConfig.accuracyThreshold.good * accuracyFactor,
        acceptable: this.currentConfig.accuracyThreshold.acceptable * accuracyFactor,
      },
      radiusMultiplier: pattern.optimalRadius / 120, // Normalized to 120m baseline
    };
  }

  /**
   * Update regional pattern from validation data
   */
  private updateRegionalPattern(data: HistoricalData): void {
    const existing = this.regionalPatterns.get(data.storeId);
    
    if (!existing) {
      this.regionalPatterns.set(data.storeId, {
        storeId: data.storeId,
        avgAccuracy: data.accuracy,
        avgConfidence: data.confidence,
        successRate: data.success ? 1.0 : 0.0,
        peakHours: [data.hour],
        optimalRadius: 120,
      });
      return;
    }

    // Moving average update
    const alpha = 0.1; // Smoothing factor
    existing.avgAccuracy = existing.avgAccuracy * (1 - alpha) + data.accuracy * alpha;
    existing.avgConfidence = existing.avgConfidence * (1 - alpha) + data.confidence * alpha;
    existing.successRate = existing.successRate * (1 - alpha) + (data.success ? 1.0 : 0.0) * alpha;

    // Update peak hours
    if (!existing.peakHours.includes(data.hour)) {
      const hourData = this.historicalData
        .filter(d => d.storeId === data.storeId && d.hour === data.hour);
      
      if (hourData.length > 10) {
        const hourSuccessRate = hourData.filter(d => d.success).length / hourData.length;
        if (hourSuccessRate > 0.7) {
          existing.peakHours.push(data.hour);
        }
      }
    }

    // Optimize radius based on success rate
    if (existing.successRate < 0.7) {
      existing.optimalRadius = Math.min(200, existing.optimalRadius * 1.1);
    } else if (existing.successRate > 0.9) {
      existing.optimalRadius = Math.max(80, existing.optimalRadius * 0.95);
    }
  }

  /**
   * Optimize global thresholds based on all data
   */
  private optimizeThresholds(): void {
    if (this.historicalData.length < this.minDataPoints) return;

    // Calculate success rate for different threshold combinations
    const recentData = this.historicalData.slice(-500);
    
    // Test different confidence thresholds
    const confidenceTests = [60, 65, 70, 75, 80];
    const accuracyTests = [15, 20, 25, 30];

    let bestConfig = { ...this.currentConfig };
    let bestScore = this.evaluateConfig(bestConfig, recentData);

    for (const confThreshold of confidenceTests) {
      for (const accThreshold of accuracyTests) {
        const testConfig: ThresholdConfig = {
          confidenceThreshold: {
            allow: confThreshold,
            warn: confThreshold - 30,
          },
          accuracyThreshold: {
            excellent: accThreshold * 0.5,
            good: accThreshold,
            acceptable: accThreshold * 2,
          },
          radiusMultiplier: 1.0,
        };

        const score = this.evaluateConfig(testConfig, recentData);
        
        if (score > bestScore) {
          bestScore = score;
          bestConfig = testConfig;
        }
      }
    }

    // Gradually update config (damping to prevent oscillation)
    this.currentConfig = {
      confidenceThreshold: {
        allow: this.currentConfig.confidenceThreshold.allow * (1 - this.learningRate) +
               bestConfig.confidenceThreshold.allow * this.learningRate,
        warn: this.currentConfig.confidenceThreshold.warn * (1 - this.learningRate) +
              bestConfig.confidenceThreshold.warn * this.learningRate,
      },
      accuracyThreshold: {
        excellent: this.currentConfig.accuracyThreshold.excellent * (1 - this.learningRate) +
                   bestConfig.accuracyThreshold.excellent * this.learningRate,
        good: this.currentConfig.accuracyThreshold.good * (1 - this.learningRate) +
              bestConfig.accuracyThreshold.good * this.learningRate,
        acceptable: this.currentConfig.accuracyThreshold.acceptable * (1 - this.learningRate) +
                    bestConfig.accuracyThreshold.acceptable * this.learningRate,
      },
      radiusMultiplier: this.currentConfig.radiusMultiplier,
    };
  }

  /**
   * Evaluate configuration quality
   * Score based on: success rate, false positive rate, user experience
   */
  private evaluateConfig(config: ThresholdConfig, data: HistoricalData[]): number {
    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;

    for (const record of data) {
      const wouldAllow = record.confidence >= config.confidenceThreshold.allow &&
                         record.accuracy <= config.accuracyThreshold.acceptable;
      
      if (wouldAllow && record.success) truePositive++;
      else if (wouldAllow && !record.success) falsePositive++;
      else if (!wouldAllow && !record.success) trueNegative++;
      else if (!wouldAllow && record.success) falseNegative++;
    }

    const total = truePositive + falsePositive + trueNegative + falseNegative;
    if (total === 0) return 0;

    // Weighted scoring
    const accuracy = (truePositive + trueNegative) / total;
    const precision = truePositive / (truePositive + falsePositive || 1);
    const recall = truePositive / (truePositive + falseNegative || 1);
    
    // F1 score with emphasis on recall (user experience)
    const f1 = 2 * (precision * recall) / (precision + recall || 1);
    
    return accuracy * 0.3 + f1 * 0.7;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): ThresholdConfig {
    return { ...this.currentConfig };
  }

  /**
   * Get regional patterns for analytics
   */
  getRegionalPatterns(): RegionalPattern[] {
    return Array.from(this.regionalPatterns.values());
  }

  /**
   * Export data for persistence
   */
  exportData(): {
    config: ThresholdConfig;
    patterns: RegionalPattern[];
    dataSize: number;
  } {
    return {
      config: this.getCurrentConfig(),
      patterns: this.getRegionalPatterns(),
      dataSize: this.historicalData.length,
    };
  }

  /**
   * Import data from persistence
   */
  importData(data: {
    config: ThresholdConfig;
    patterns: RegionalPattern[];
  }): void {
    this.currentConfig = data.config;
    this.regionalPatterns = new Map(
      data.patterns.map(p => [p.storeId, p])
    );
  }

  /**
   * Reset optimizer (for testing)
   */
  reset(): void {
    this.historicalData = [];
    this.regionalPatterns.clear();
  }
}
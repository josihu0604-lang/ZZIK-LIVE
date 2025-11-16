import { NextRequest, NextResponse } from 'next/server';
import { AdaptiveThresholdOptimizer } from '@/lib/ai/adaptive-threshold';
import { SpoofingDetector } from '@/lib/ai/spoofing-detector';
import { PredictiveCacheSystem } from '@/lib/ai/predictive-cache';

// Singleton instances (in production, use Redis or DB for persistence)
const thresholdOptimizer = new AdaptiveThresholdOptimizer();
const spoofingDetector = new SpoofingDetector();
const predictiveCache = new PredictiveCacheSystem();

export const runtime = 'nodejs';

/**
 * POST /api/ai/optimize
 * Main AI optimization endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'recordValidation':
        return handleRecordValidation(data);
      
      case 'checkSpoofing':
        return handleCheckSpoofing(data);
      
      case 'getOptimizedThreshold':
        return handleGetOptimizedThreshold(data);
      
      case 'getPredictions':
        return handleGetPredictions(data);
      
      case 'recordVisit':
        return handleRecordVisit(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI optimize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/optimize
 * Get AI system statistics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'config':
        return NextResponse.json({
          currentConfig: thresholdOptimizer.getCurrentConfig(),
          regionalPatterns: thresholdOptimizer.getRegionalPatterns(),
        });
      
      case 'spoofing':
        return NextResponse.json({
          statistics: spoofingDetector.getStatistics(),
        });
      
      case 'export':
        return NextResponse.json({
          thresholdData: thresholdOptimizer.exportData(),
          spoofingStats: spoofingDetector.getStatistics(),
        });
      
      default:
        return NextResponse.json({
          message: 'AI Optimization API',
          endpoints: {
            POST: [
              'recordValidation',
              'checkSpoofing',
              'getOptimizedThreshold',
              'getPredictions',
              'recordVisit',
            ],
            GET: [
              '?type=config',
              '?type=spoofing',
              '?type=export',
            ],
          },
        });
    }
  } catch (error) {
    console.error('AI optimize GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Record validation for learning
 */
function handleRecordValidation(data: any) {
  const {
    timestamp,
    hour,
    dayOfWeek,
    weather,
    accuracy,
    confidence,
    success,
    storeId,
    lat,
    lng,
  } = data;

  thresholdOptimizer.recordValidation({
    timestamp: timestamp || Date.now(),
    hour: hour || new Date().getHours(),
    dayOfWeek: dayOfWeek || new Date().getDay(),
    weather,
    accuracy,
    confidence,
    success,
    storeId,
    lat,
    lng,
  });

  return NextResponse.json({
    success: true,
    message: 'Validation recorded',
  });
}

/**
 * Check for GPS spoofing
 */
function handleCheckSpoofing(data: any) {
  const { userId, lat, lng, accuracy, timestamp } = data;

  const result = spoofingDetector.detectSpoofing({
    userId,
    lat,
    lng,
    accuracy,
    timestamp: timestamp || Date.now(),
  });

  return NextResponse.json({
    anomalyScore: result.score,
    severity: result.severity,
    reasons: result.reasons,
    shouldBlock: result.shouldBlock,
    isBlocked: spoofingDetector.isUserBlocked(userId),
  });
}

/**
 * Get optimized threshold for context
 */
function handleGetOptimizedThreshold(data: any) {
  const { storeId, hour, dayOfWeek, weather } = data;

  const optimizedConfig = thresholdOptimizer.getOptimizedThreshold({
    storeId,
    hour: hour || new Date().getHours(),
    dayOfWeek: dayOfWeek || new Date().getDay(),
    weather,
  });

  return NextResponse.json({
    optimizedConfig,
    defaultConfig: thresholdOptimizer.getCurrentConfig(),
  });
}

/**
 * Get movement predictions
 */
function handleGetPredictions(data: any) {
  const { userId, currentLocation, count } = data;

  const predictions = predictiveCache.predictNextDestinations(
    userId,
    currentLocation,
    count || 3
  );

  const cacheRecommendations = predictiveCache.getCacheRecommendations(
    userId,
    currentLocation
  );

  const userStats = predictiveCache.getUserStatistics(userId);

  return NextResponse.json({
    predictions,
    cacheRecommendations,
    userStatistics: userStats,
  });
}

/**
 * Record user visit for pattern learning
 */
function handleRecordVisit(data: any) {
  const { userId, storeId, lat, lng, timestamp } = data;

  predictiveCache.recordVisit({
    userId,
    storeId,
    lat,
    lng,
    timestamp: timestamp || Date.now(),
  });

  return NextResponse.json({
    success: true,
    message: 'Visit recorded',
  });
}
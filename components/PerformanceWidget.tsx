import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { getPerformanceMetrics, PerformanceMetrics } from '../utils/performanceMonitor';

interface MetricThreshold {
  good: number;
  needsImprovement: number;
}

const thresholds: Record<string, MetricThreshold> = {
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  TTFB: { good: 800, needsImprovement: 1800 },
  TTI: { good: 3800, needsImprovement: 7300 },
  TBT: { good: 200, needsImprovement: 600 },
  INP: { good: 200, needsImprovement: 500 }
};

const metricDescriptions: Record<string, string> = {
  FCP: 'First Contentful Paint - Time until first content appears',
  LCP: 'Largest Contentful Paint - Time until main content loads',
  FID: 'First Input Delay - Time until page responds to first interaction',
  CLS: 'Cumulative Layout Shift - Visual stability score',
  TTFB: 'Time to First Byte - Server response time',
  TTI: 'Time to Interactive - Time until page is fully interactive',
  TBT: 'Total Blocking Time - Sum of blocking time',
  INP: 'Interaction to Next Paint - Responsiveness to user input'
};

const PerformanceWidget: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    // Only show in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || 
        localStorage.getItem('showPerformanceWidget') === 'true') {
      setIsVisible(true);
    }

    // Update metrics every 5 seconds
    const updateMetrics = () => {
      const newMetrics = getPerformanceMetrics();
      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !metrics) return null;

  const getMetricStatus = (key: string, value: number | null): 'good' | 'needs-improvement' | 'poor' | 'unknown' => {
    if (value === null) return 'unknown';
    const threshold = thresholds[key];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'needs-improvement':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'poor':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'needs-improvement':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'poor':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatValue = (key: string, value: number | null): string => {
    if (value === null) return 'N/A';
    if (key === 'CLS') return value.toFixed(3);
    return `${value}ms`;
  };

  const calculateOverallScore = (): number => {
    let score = 0;
    let count = 0;

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null && thresholds[key]) {
        const threshold = thresholds[key];
        if (value <= threshold.good) {
          score += 100;
        } else if (value <= threshold.needsImprovement) {
          score += 50;
        } else {
          score += 0;
        }
        count++;
      }
    });

    return count > 0 ? Math.round(score / count) : 0;
  };

  const overallScore = calculateOverallScore();
  const scoreStatus = overallScore >= 90 ? 'good' : overallScore >= 50 ? 'needs-improvement' : 'poor';

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-auto' : 'w-96'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            <span className="font-semibold text-sm">Performance Monitor</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              scoreStatus === 'good' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              scoreStatus === 'needs-improvement' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {overallScore}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
                {isMinimized ? (
                  <path d="M3 5h10l-5 6z" />
                ) : (
                  <path d="M3 11h10l-5-6z" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {Object.entries(metrics).map(([key, value]) => {
                const status = getMetricStatus(key, value);
                return (
                  <div key={key} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {getStatusIcon(status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{key}</span>
                        <span className={`text-sm font-mono ${getStatusColor(status)}`}>
                          {formatValue(key, value)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {metricDescriptions[key]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Good performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-yellow-500" />
                  <span>Needs improvement</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-500" />
                  <span>Poor performance</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceWidget;
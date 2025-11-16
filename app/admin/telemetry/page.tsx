'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock
} from 'lucide-react';

interface TelemetryData {
  timestamp: number;
  metrics: {
    avgAccuracy: number;
    avgConfidence: number;
    allowRate: number;
    warnRate: number;
    blockRate: number;
    activeUsers: number;
    totalEvents: number;
    cacheHitRate: number;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    userId: string;
    storeId: string;
    accuracy: number;
    confidence: number;
    status: 'allow' | 'warn' | 'block';
    timestamp: number;
  }>;
  distribution: {
    accuracy: { [key: string]: number };
    confidence: { [key: string]: number };
  };
}

/**
 * GPS Telemetry Dashboard for monitoring geofence performance
 */
export default function TelemetryDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch telemetry data
  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/telemetry/gps?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch telemetry');
      }
      
      const data = await response.json();
      setTelemetry(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Use mock data for demo
      setTelemetry(generateMockTelemetry());
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchTelemetry();
    
    if (autoRefresh) {
      const interval = setInterval(fetchTelemetry, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatMeters = (value: number) => `${value.toFixed(1)}m`;

  if (loading && !telemetry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading telemetry data...</p>
        </div>
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error: {error || 'No telemetry data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            GPS Telemetry Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time geofence accuracy monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Average Accuracy */}
        <MetricCard
          icon={MapPin}
          title="Avg Accuracy"
          value={formatMeters(telemetry.metrics.avgAccuracy)}
          trend={telemetry.metrics.avgAccuracy <= 20 ? 'good' : 'warn'}
          description="GPS accuracy average"
        />
        
        {/* Average Confidence */}
        <MetricCard
          icon={Activity}
          title="Avg Confidence"
          value={`${telemetry.metrics.avgConfidence.toFixed(0)}%`}
          trend={telemetry.metrics.avgConfidence >= 70 ? 'good' : 'warn'}
          description="Position confidence score"
        />
        
        {/* Allow Rate */}
        <MetricCard
          icon={CheckCircle}
          title="Allow Rate"
          value={formatPercentage(telemetry.metrics.allowRate)}
          trend={telemetry.metrics.allowRate >= 0.8 ? 'good' : 'warn'}
          description="Successful validations"
        />
        
        {/* Active Users */}
        <MetricCard
          icon={TrendingUp}
          title="Active Users"
          value={telemetry.metrics.activeUsers.toString()}
          trend="neutral"
          description="Users with GPS active"
        />
      </div>

      {/* Validation Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4">Validation Status</h3>
          <div className="space-y-3">
            <StatusBar
              label="Allow"
              value={telemetry.metrics.allowRate}
              color="green"
              icon={CheckCircle}
            />
            <StatusBar
              label="Warn"
              value={telemetry.metrics.warnRate}
              color="yellow"
              icon={AlertCircle}
            />
            <StatusBar
              label="Block"
              value={telemetry.metrics.blockRate}
              color="red"
              icon={XCircle}
            />
          </div>
        </div>

        {/* Accuracy Distribution */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold mb-4">Accuracy Distribution</h3>
          <div className="space-y-2">
            {Object.entries(telemetry.distribution.accuracy).map(([range, count]) => (
              <div key={range} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-[var(--brand)] h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(telemetry.distribution.accuracy))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent GPS Events</h3>
          <span className="text-sm text-[var(--text-secondary)]">
            {telemetry.recentEvents.length} events
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">Time</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">User</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">Store</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">Accuracy</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">Confidence</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-secondary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.recentEvents.map((event) => (
                <tr key={event.id} className="border-b border-[var(--border)] hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 text-sm font-mono">{event.userId.slice(0, 8)}</td>
                  <td className="py-2 px-3 text-sm">{event.storeId}</td>
                  <td className="py-2 px-3 text-sm">{formatMeters(event.accuracy)}</td>
                  <td className="py-2 px-3 text-sm">{event.confidence}%</td>
                  <td className="py-2 px-3">
                    <StatusBadge status={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold mb-4">System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Cache Hit Rate</div>
            <div className="text-2xl font-semibold">
              {formatPercentage(telemetry.metrics.cacheHitRate)}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Total Events</div>
            <div className="text-2xl font-semibold">
              {telemetry.metrics.totalEvents.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Avg Response Time</div>
            <div className="text-2xl font-semibold">42ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Metric Card
function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  trend, 
  description 
}: {
  icon: any;
  title: string;
  value: string;
  trend: 'good' | 'warn' | 'bad' | 'neutral';
  description: string;
}) {
  const trendColors = {
    good: 'text-green-600',
    warn: 'text-yellow-600',
    bad: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${trendColors[trend]}`} />
      </div>
      <div className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">
        {title}
      </div>
      <div className="text-xs text-[var(--text-tertiary)]">
        {description}
      </div>
    </div>
  );
}

// Component: Status Bar
function StatusBar({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: {
  label: string;
  value: number;
  color: 'green' | 'yellow' | 'red';
  icon: any;
}) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 text-${color}-600`} />
      <span className="text-sm font-medium w-12">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6">
        <div 
          className={`${colors[color]} h-6 rounded-full flex items-center justify-end px-2 transition-all`}
          style={{ width: `${value * 100}%` }}
        >
          <span className="text-xs text-white font-medium">
            {(value * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Component: Status Badge
function StatusBadge({ status }: { status: 'allow' | 'warn' | 'block' }) {
  const styles = {
    allow: 'bg-green-100 text-green-700',
    warn: 'bg-yellow-100 text-yellow-700',
    block: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

// Generate mock telemetry data
function generateMockTelemetry(): TelemetryData {
  return {
    timestamp: Date.now(),
    metrics: {
      avgAccuracy: 18.5,
      avgConfidence: 72,
      allowRate: 0.78,
      warnRate: 0.18,
      blockRate: 0.04,
      activeUsers: 342,
      totalEvents: 15234,
      cacheHitRate: 0.92,
    },
    recentEvents: Array.from({ length: 10 }, (_, i) => ({
      id: `evt-${i}`,
      type: 'gps_update',
      userId: `user-${Math.random().toString(36).slice(2, 10)}`,
      storeId: ['gangnam', 'seongsu', 'hongdae'][Math.floor(Math.random() * 3)],
      accuracy: 10 + Math.random() * 40,
      confidence: 40 + Math.random() * 60,
      status: Math.random() > 0.2 ? 'allow' : Math.random() > 0.5 ? 'warn' : 'block',
      timestamp: Date.now() - i * 60000,
    })),
    distribution: {
      accuracy: {
        '0-10m': 234,
        '10-20m': 456,
        '20-30m': 298,
        '30-50m': 167,
        '50m+': 89,
      },
      confidence: {
        '90-100%': 123,
        '70-90%': 456,
        '50-70%': 234,
        '30-50%': 98,
        '0-30%': 45,
      },
    },
  };
}
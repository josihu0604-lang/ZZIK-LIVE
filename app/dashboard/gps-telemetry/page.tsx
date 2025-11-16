'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Activity, MapPin, TrendingUp, AlertCircle, 
  Users, Clock, BarChart3, PieChart 
} from 'lucide-react';

interface GPSTelemetryData {
  timestamp: number;
  accuracy: number;
  confidence: number;
  status: 'allow' | 'warn' | 'block';
  storeId?: string;
}

interface Stats {
  avgAccuracy: number;
  avgConfidence: number;
  allowRate: number;
  warnRate: number;
  blockRate: number;
  totalSessions: number;
  activeUsers: number;
}

export default function GPSTelemetryDashboard() {
  const [telemetryData, setTelemetryData] = useState<GPSTelemetryData[]>([]);
  const [stats, setStats] = useState<Stats>({
    avgAccuracy: 0,
    avgConfidence: 0,
    allowRate: 0,
    warnRate: 0,
    blockRate: 0,
    totalSessions: 0,
    activeUsers: 0,
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  const [isLive, setIsLive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock data generation for demo
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const dataPoints: GPSTelemetryData[] = [];
      const numPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 288 : 1008;
      
      for (let i = 0; i < numPoints; i++) {
        const accuracy = 5 + Math.random() * 45;
        const confidence = Math.max(20, Math.min(95, 100 - accuracy * 1.5 + Math.random() * 20));
        let status: 'allow' | 'warn' | 'block';
        
        if (confidence >= 70) status = 'allow';
        else if (confidence >= 40) status = 'warn';
        else status = 'block';

        dataPoints.push({
          timestamp: now - (numPoints - i) * 60000,
          accuracy: Math.round(accuracy),
          confidence: Math.round(confidence),
          status,
          storeId: Math.random() > 0.5 ? 'gangnam' : Math.random() > 0.5 ? 'seongsu' : 'hongdae',
        });
      }
      
      setTelemetryData(dataPoints);
      calculateStats(dataPoints);
    };

    generateMockData();
    const interval = isLive ? setInterval(generateMockData, 5000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, isLive]);

  // Calculate statistics
  const calculateStats = (data: GPSTelemetryData[]) => {
    if (data.length === 0) return;

    const accuracies = data.map(d => d.accuracy);
    const confidences = data.map(d => d.confidence);
    const statuses = data.map(d => d.status);

    const allowCount = statuses.filter(s => s === 'allow').length;
    const warnCount = statuses.filter(s => s === 'warn').length;
    const blockCount = statuses.filter(s => s === 'block').length;

    setStats({
      avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
      avgConfidence: Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length),
      allowRate: Math.round((allowCount / data.length) * 100),
      warnRate: Math.round((warnCount / data.length) * 100),
      blockRate: Math.round((blockCount / data.length) * 100),
      totalSessions: data.length,
      activeUsers: Math.floor(data.length / 3), // Mock
    });
  };

  // Format time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get chart data
  const getChartData = () => {
    const recent = telemetryData.slice(-20);
    return {
      labels: recent.map(d => formatTime(d.timestamp)),
      accuracy: recent.map(d => d.accuracy),
      confidence: recent.map(d => d.confidence),
    };
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GPS 텔레메트리 대시보드</h1>
              <p className="text-gray-500 mt-1">실시간 GPS 성능 모니터링</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Live indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">{isLive ? 'LIVE' : 'PAUSED'}</span>
              </div>
              
              {/* Time range selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="1h">1시간</option>
                <option value="24h">24시간</option>
                <option value="7d">7일</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Accuracy */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-500">평균</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">±{stats.avgAccuracy}m</div>
            <div className="text-sm text-gray-500">GPS 정확도</div>
            <div className="mt-2 h-1 bg-gray-100 rounded">
              <div 
                className={`h-1 rounded ${
                  stats.avgAccuracy <= 20 ? 'bg-green-500' :
                  stats.avgAccuracy <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (20 / stats.avgAccuracy) * 100)}%` }}
              />
            </div>
          </div>

          {/* Average Confidence */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">평균</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgConfidence}%</div>
            <div className="text-sm text-gray-500">신뢰도</div>
            <div className="mt-2 h-1 bg-gray-100 rounded">
              <div 
                className={`h-1 rounded ${
                  stats.avgConfidence >= 70 ? 'bg-green-500' :
                  stats.avgConfidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.avgConfidence}%` }}
              />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-gray-500">Allow + Warn</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.allowRate + stats.warnRate}%</div>
            <div className="text-sm text-gray-500">성공률</div>
            <div className="mt-2 flex gap-1">
              <div className="flex-1 h-1 bg-green-500 rounded" style={{ width: `${stats.allowRate}%` }} />
              <div className="flex-1 h-1 bg-yellow-500 rounded" style={{ width: `${stats.warnRate}%` }} />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-500">현재</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
            <div className="text-sm text-gray-500">활성 사용자</div>
            <div className="mt-2 text-xs text-green-600">
              +{Math.floor(Math.random() * 10 + 5)}% from yesterday
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accuracy/Confidence Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">실시간 GPS 성능</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.accuracy.map((acc, i) => {
                const conf = chartData.confidence[i];
                return (
                  <div key={i} className="flex-1 flex flex-col gap-1">
                    <div 
                      className="bg-blue-500 rounded-t"
                      style={{ height: `${(acc / 100) * 100}%` }}
                      title={`정확도: ${acc}m`}
                    />
                    <div 
                      className="bg-green-500 rounded-b"
                      style={{ height: `${conf}%` }}
                      title={`신뢰도: ${conf}%`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>← 이전</span>
              <span>시간</span>
              <span>최근 →</span>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600">정확도 (m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600">신뢰도 (%)</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">상태 분포</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Allow</span>
                  <span className="text-sm font-medium">{stats.allowRate}%</span>
                </div>
                <div className="h-8 bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${stats.allowRate}%` }}
                  >
                    {stats.allowRate > 10 && `${stats.allowRate}%`}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Warn</span>
                  <span className="text-sm font-medium">{stats.warnRate}%</span>
                </div>
                <div className="h-8 bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${stats.warnRate}%` }}
                  >
                    {stats.warnRate > 10 && `${stats.warnRate}%`}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Block</span>
                  <span className="text-sm font-medium">{stats.blockRate}%</span>
                </div>
                <div className="h-8 bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${stats.blockRate}%` }}
                  >
                    {stats.blockRate > 10 && `${stats.blockRate}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* Store breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">매장별 통계</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">강남점</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">성수점</span>
                  <span className="font-medium text-yellow-600">78%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">홍대점</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">최근 이벤트</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-600 font-medium">시간</th>
                  <th className="text-left py-2 text-gray-600 font-medium">매장</th>
                  <th className="text-left py-2 text-gray-600 font-medium">정확도</th>
                  <th className="text-left py-2 text-gray-600 font-medium">신뢰도</th>
                  <th className="text-left py-2 text-gray-600 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {telemetryData.slice(-10).reverse().map((data, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{formatTime(data.timestamp)}</td>
                    <td className="py-2 text-gray-600">{data.storeId || '-'}</td>
                    <td className="py-2 text-gray-600">±{data.accuracy}m</td>
                    <td className="py-2 text-gray-600">{data.confidence}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.status === 'allow' ? 'bg-green-100 text-green-700' :
                        data.status === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
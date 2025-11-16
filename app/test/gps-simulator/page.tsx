'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, MapPin, Activity, AlertCircle } from 'lucide-react';
import { GPSSimulator } from '@/lib/geolocation/gps-simulator';
import { EnhancedGPS, type GPSPosition } from '@/lib/geolocation/enhanced-gps';
import { GeofenceValidator, type Store } from '@/lib/geolocation/geofence';
import MapLiveExplore from '@/components/map/MapLiveExplore';
import { GPSStatusBadge } from '@/components/map/DistanceBadge';

// Test stores
const testStores: Store[] = [
  { id: 'gangnam', name: '강남점', lat: 37.4979, lng: 127.0276, radius: 120 },
  { id: 'seongsu', name: '성수점', lat: 37.5446, lng: 127.0565, radius: 120 },
  { id: 'hongdae', name: '홍대점', lat: 37.5563, lng: 126.9220, radius: 120 },
];

export default function GPSSimulatorPage() {
  const simulatorRef = useRef<GPSSimulator | null>(null);
  const enhancedGPSRef = useRef<EnhancedGPS | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('WALKING_TO_STORE');
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [filteredPosition, setFilteredPosition] = useState<GPSPosition | null>(null);
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map());
  const [useKalman, setUseKalman] = useState(true);
  const [showRawGPS, setShowRawGPS] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'warn' | 'error' }>>([]);

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new GPSSimulator();
    enhancedGPSRef.current = new EnhancedGPS({ kalmanEnabled: useKalman });

    // Subscribe to simulator updates
    const unsubscribeSim = simulatorRef.current.watch((position) => {
      setCurrentPosition(position);
      addLog(`Raw GPS: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)} (±${position.accuracy}m)`, 'info');
    });

    // Subscribe to enhanced GPS updates
    const unsubscribeGPS = enhancedGPSRef.current.watchPosition(
      (position) => {
        setFilteredPosition(position);
        validateStores(position);
        addLog(`Filtered GPS: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)} (confidence: ${position.confidence}%)`, 'info');
      },
      (error) => {
        addLog(`GPS Error: ${error.message}`, 'error');
      }
    );

    return () => {
      unsubscribeSim();
      unsubscribeGPS();
      simulatorRef.current?.stop();
      enhancedGPSRef.current?.dispose();
    };
  }, [useKalman]);

  // Validate stores
  const validateStores = (position: GPSPosition) => {
    const results = new Map();
    testStores.forEach((store) => {
      const result = GeofenceValidator.validate(position, store);
      results.set(store.id, result);
    });
    setValidationResults(results);
  };

  // Add log entry
  const addLog = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-9), { time, message, type }]);
  };

  // Start simulation
  const handleStart = () => {
    if (!simulatorRef.current) return;
    
    simulatorRef.current.start(selectedScenario as keyof typeof GPSSimulator.SCENARIOS);
    setIsRunning(true);
    addLog(`Started scenario: ${selectedScenario}`, 'info');
  };

  // Stop simulation
  const handleStop = () => {
    if (!simulatorRef.current) return;
    
    simulatorRef.current.stop();
    setIsRunning(false);
    addLog('Simulation stopped', 'warn');
  };

  // Reset
  const handleReset = () => {
    handleStop();
    setCurrentPosition(null);
    setFilteredPosition(null);
    setValidationResults(new Map());
    setLogs([]);
    enhancedGPSRef.current?.resetFilter();
    addLog('Reset complete', 'info');
  };

  // Trigger GPS error
  const triggerError = (code: number) => {
    simulatorRef.current?.triggerError(code);
    addLog(`Triggered GPS error code: ${code}`, 'error');
  };

  const displayPosition = showRawGPS ? currentPosition : filteredPosition;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            GPS 시뮬레이터 테스트
          </h1>
          <p className="text-[var(--text-secondary)]">
            다양한 GPS 시나리오를 테스트하고 지오펜스 검증 로직을 확인합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            {/* Scenario Selection */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">시나리오 선택</h3>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg"
              >
                <option value="WALKING_TO_STORE">🚶 매장으로 걷기 (좋은 GPS)</option>
                <option value="POOR_GPS_INDOOR">🏢 실내 (나쁜 GPS)</option>
                <option value="BOUNDARY_JITTER">📍 경계선 떨림</option>
                <option value="VEHICLE_MOVEMENT">🚗 차량 이동</option>
                <option value="GPS_ACQUISITION">📡 GPS 신호 획득</option>
                <option value="MULTI_STORE_TOUR">🏪 멀티 스토어 투어</option>
              </select>
            </div>

            {/* Playback Controls */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">제어</h3>
              <div className="flex gap-2">
                <button
                  onClick={isRunning ? handleStop : handleStart}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      정지
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      시작
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">설정</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Kalman Filter</span>
                  <input
                    type="checkbox"
                    checked={useKalman}
                    onChange={(e) => setUseKalman(e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Raw GPS 표시</span>
                  <input
                    type="checkbox"
                    checked={showRawGPS}
                    onChange={(e) => setShowRawGPS(e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Error Triggers */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">에러 시뮬레이션</h3>
              <div className="space-y-2">
                <button
                  onClick={() => triggerError(1)}
                  className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  권한 거부
                </button>
                <button
                  onClick={() => triggerError(2)}
                  className="w-full px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100"
                >
                  신호 없음
                </button>
                <button
                  onClick={() => triggerError(3)}
                  className="w-full px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-100"
                >
                  타임아웃
                </button>
              </div>
            </div>

            {/* GPS Status */}
            {displayPosition && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">GPS 상태</h3>
                <div className="space-y-2">
                  <GPSStatusBadge
                    accuracy={displayPosition.accuracy}
                    confidence={displayPosition.confidence}
                  />
                  <div className="text-xs text-[var(--text-secondary)] space-y-1">
                    <p>위도: {displayPosition.lat.toFixed(6)}</p>
                    <p>경도: {displayPosition.lng.toFixed(6)}</p>
                    <p>정확도: ±{displayPosition.accuracy}m</p>
                    <p>신뢰도: {displayPosition.confidence}%</p>
                    <p>소스: {displayPosition.source}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map Display */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">실시간 지도</h3>
              <MapLiveExplore
                stores={testStores}
                height={400}
                enableGeofence={true}
              />
            </div>

            {/* Validation Results */}
            {validationResults.size > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">지오펜스 검증 결과</h3>
                <div className="space-y-2">
                  {Array.from(validationResults.entries()).map(([storeId, result]) => {
                    const store = testStores.find((s) => s.id === storeId);
                    const statusColor = {
                      allow: 'text-green-600 bg-green-50',
                      warn: 'text-yellow-600 bg-yellow-50',
                      block: 'text-gray-600 bg-gray-50',
                    }[result.status];

                    return (
                      <div
                        key={storeId}
                        className={`p-3 rounded-lg border ${
                          result.status === 'allow'
                            ? 'border-green-200'
                            : result.status === 'warn'
                            ? 'border-yellow-200'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{store?.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          <p>거리: {result.distance}m</p>
                          <p>{result.recommendation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">로그</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-[var(--text-secondary)]">로그가 없습니다...</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${
                        log.type === 'error'
                          ? 'text-red-600'
                          : log.type === 'warn'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="opacity-50">{log.time}</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
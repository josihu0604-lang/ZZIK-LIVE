'use client';

import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { GeofenceValidator } from '@/lib/geolocation/geofence';

interface DistanceBadgeProps {
  distance: number; // meters
  eta?: number; // seconds
  status: 'allow' | 'warn' | 'block';
  confidence: number;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Distance/ETA badge component for store markers
 * Shows walking distance and estimated time with status coloring
 */
export default function DistanceBadge({
  distance,
  eta,
  status,
  confidence,
  loading = false,
  onClick,
}: DistanceBadgeProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 0) return '계산 중...';
    if (meters < 100) return '바로 앞';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'allow':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
        };
      case 'warn':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
        };
      case 'block':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-500',
          icon: 'text-gray-400',
        };
    }
  };

  const styles = getStatusStyles();
  const formattedDistance = formatDistance(distance);
  const formattedETA = eta ? GeofenceValidator.formatETA(eta) : null;

  return (
    <button
      onClick={onClick}
      disabled={loading || status === 'block'}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-full text-xs font-medium
        transition-all duration-200
        ${loading ? 'opacity-50' : ''}
        ${status !== 'block' ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed'}
      `}
    >
      {/* Icon */}
      {status === 'allow' ? (
        <MapPin className={`w-3 h-3 ${styles.icon}`} />
      ) : status === 'warn' ? (
        <Navigation className={`w-3 h-3 ${styles.icon}`} />
      ) : (
        <AlertCircle className={`w-3 h-3 ${styles.icon}`} />
      )}

      {/* Distance */}
      <span>{formattedDistance}</span>

      {/* ETA (if available) */}
      {formattedETA && status !== 'block' && (
        <>
          <span className="opacity-50">·</span>
          <span>{formattedETA}</span>
        </>
      )}

      {/* Confidence indicator (low confidence) */}
      {confidence < 50 && status !== 'block' && (
        <span 
          className="inline-block w-1 h-1 bg-current rounded-full animate-pulse ml-1"
          title={`GPS 신뢰도: ${confidence}%`}
        />
      )}
    </button>
  );
}

/**
 * Mini distance badge for compact display
 */
export function MiniDistanceBadge({ 
  distance, 
  status 
}: { 
  distance: number; 
  status: 'allow' | 'warn' | 'block';
}) {
  const formatMiniDistance = (meters: number): string => {
    if (meters < 0) return '...';
    if (meters < 100) return '근처';
    if (meters < 1000) return `${Math.round(meters / 10) * 10}m`; // Round to 10s
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'allow': return 'text-green-600 bg-green-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'block': return 'text-gray-400 bg-gray-50';
    }
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 text-[10px] font-medium
        ${getStatusColor()} rounded-full
      `}
    >
      {formatMiniDistance(distance)}
    </span>
  );
}

/**
 * GPS status badge for header/overlay
 */
export function GPSStatusBadge({ 
  accuracy, 
  confidence 
}: { 
  accuracy: number; 
  confidence: number;
}) {
  const quality = GeofenceValidator.getGPSQuality(accuracy);
  
  const getQualityStyles = () => {
    switch (quality.level) {
      case 'excellent': 
        return 'bg-green-50 text-green-700 border-green-200';
      case 'good': 
        return 'bg-lime-50 text-lime-700 border-lime-200';
      case 'acceptable': 
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'poor': 
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        ${getQualityStyles()} border rounded-full
        text-xs font-medium
      `}
    >
      <div className="flex items-center gap-1">
        <div 
          className={`
            w-1.5 h-1.5 rounded-full
            ${quality.level === 'poor' ? 'animate-pulse' : ''}
          `}
          style={{ backgroundColor: quality.color }}
        />
        <span>{quality.description}</span>
      </div>
      {confidence < 70 && (
        <>
          <span className="opacity-50">·</span>
          <span>신뢰도 {confidence}%</span>
        </>
      )}
    </div>
  );
}
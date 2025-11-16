'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPinOff } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'gps' | 'map' | 'network' | 'unknown';
  retryCount: number;
}

/**
 * Error Boundary for GPS and Map components
 * Provides graceful fallback and recovery options
 */
export class GPSErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Classify error type
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message.includes('GPS') || error.message.includes('geolocation')) {
      errorType = 'gps';
    } else if (error.message.includes('mapbox') || error.message.includes('map')) {
      errorType = 'map';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorType = 'network';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to analytics
    analytics.track('gps_error_boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GPS Error Boundary caught:', error, errorInfo);
    }

    // Auto-retry for transient errors
    if (this.shouldAutoRetry()) {
      this.scheduleRetry();
    }
  }

  shouldAutoRetry(): boolean {
    const { errorType, retryCount } = this.state;
    
    // Don't auto-retry if manually retried recently
    if (retryCount > 3) return false;
    
    // Auto-retry network and map errors
    return errorType === 'network' || errorType === 'map';
  }

  scheduleRetry(): void {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  handleRetry = () => {
    analytics.track('gps_error_retry', {
      errorType: this.state.errorType,
      retryCount: this.state.retryCount + 1,
    });

    this.setState({
      hasError: false,
      error: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  renderErrorUI() {
    const { error, errorType, retryCount } = this.state;

    const errorMessages = {
      gps: {
        title: 'GPS 오류',
        description: '위치 정보를 가져올 수 없습니다.',
        icon: MapPinOff,
        suggestion: '위치 권한을 확인하거나 GPS를 활성화해주세요.',
      },
      map: {
        title: '지도 로딩 오류',
        description: '지도를 불러올 수 없습니다.',
        icon: AlertTriangle,
        suggestion: '인터넷 연결을 확인해주세요.',
      },
      network: {
        title: '네트워크 오류',
        description: '서버와 연결할 수 없습니다.',
        icon: AlertTriangle,
        suggestion: '인터넷 연결을 확인해주세요.',
      },
      unknown: {
        title: '오류 발생',
        description: '예상치 못한 오류가 발생했습니다.',
        icon: AlertTriangle,
        suggestion: '페이지를 새로고침해주세요.',
      },
    };

    const errorInfo = errorMessages[errorType];
    const Icon = errorInfo.icon;

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-white rounded-xl border border-[var(--border)]">
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-red-500" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {errorInfo.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {errorInfo.description}
          </p>

          {/* Suggestion */}
          <p className="text-xs text-[var(--text-tertiary)] mb-6">
            {errorInfo.suggestion}
          </p>

          {/* Error details (dev only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="w-full mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer">
                오류 상세 정보
              </summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-left overflow-x-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              disabled={retryCount > 5}
              className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
              {retryCount > 0 && ` (${retryCount})`}
            </button>
            
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-gray-100 text-[var(--text-primary)] rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use default error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

/**
 * Hook for using error boundary
 */
export function useGPSErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const throwError = (error: Error) => setError(error);

  return { throwError, resetError };
}
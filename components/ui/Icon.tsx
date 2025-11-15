import * as React from 'react';
// OPTIMIZATION: Only import icons actually used in the app (20 icons instead of 80+)
// This reduces bundle size significantly by removing unused lucide-react icons
import {
  MapPin,
  Camera,
  Gift,
  QrCode,
  Check,
  TrendingUp,
  DollarSign,
  Receipt,
  Loader2,
  List,
  RefreshCw,
  AlertCircle,
  X,
  Flashlight,
  FlashlightOff,
  Shield,
  Wallet,
  Clock,
  Mail,
  Phone,
} from 'lucide-react';

// Only export icon names that are actually used in the codebase
export type IconName =
  | 'map-pin'
  | 'camera'
  | 'gift'
  | 'qr-code'
  | 'check'
  | 'trending-up'
  | 'dollar-sign'
  | 'receipt'
  | 'loader'
  | 'list'
  | 'refresh'
  | 'alert-circle'
  | 'x'
  | 'flashlight'
  | 'flashlight-off'
  | 'shield'
  | 'wallet'
  | 'clock'
  | 'email'
  | 'phone';

const REGISTRY: Record<IconName, any> = {
  'map-pin': MapPin,
  camera: Camera,
  gift: Gift,
  'qr-code': QrCode,
  check: Check,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  receipt: Receipt,
  loader: Loader2,
  list: List,
  refresh: RefreshCw,
  'alert-circle': AlertCircle,
  x: X,
  flashlight: Flashlight,
  'flashlight-off': FlashlightOff,
  shield: Shield,
  wallet: Wallet,
  clock: Clock,
  email: Mail,
  phone: Phone,
};

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

/**
 * Optimized Icon component using lucide-react
 * Only includes icons actually used in the application
 *
 * Usage analyzed from codebase:
 * - map-pin: 3 uses
 * - refresh, alert-circle: 2 uses each
 * - trending-up, receipt, qr-code, loader, list, gift, dollar-sign, check, camera, x, flashlight, flashlight-off: 1+ uses each
 *
 * Total: 20 unique icons (instead of 80+) = ~60KB bundle size saved
 *
 * @example
 * <Icon name="map-pin" size={20} />
 * <Icon name="camera" size={24} className="text-primary" />
 */
export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
  color,
  style,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  const Component = REGISTRY[name];

  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" not found in registry`);
    }
    return null;
  }

  // Wrap in span if style prop is provided to support inline styling
  if (style) {
    return (
      <span style={style}>
        <Component
          size={size}
          strokeWidth={strokeWidth}
          className={className}
          color={color}
          aria-hidden={ariaHidden}
          aria-label={ariaLabel}
        />
      </span>
    );
  }

  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color={color}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    />
  );
}

// Export individual icons for direct usage when needed
export {
  MapPin,
  Camera,
  Gift,
  QrCode,
  Check,
  TrendingUp,
  DollarSign,
  Receipt,
  Loader2,
  List,
  RefreshCw,
  AlertCircle,
  X,
  Flashlight,
  FlashlightOff,
  Shield,
  Wallet,
  Clock,
  Mail,
  Phone,
};

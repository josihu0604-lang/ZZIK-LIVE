import * as React from 'react';
import {
  MapPin,
  Camera,
  Wallet,
  Gift,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  QrCode,
  Menu,
  Settings,
  User,
  LogOut,
  Check,
  AlertCircle,
  Info,
  Zap,
  TrendingUp,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Navigation,
  Target,
  Map as MapIcon,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  ShoppingBag,
  Store,
  Coffee,
  Utensils,
  Film,
  Music,
  Gamepad,
  Sparkles,
  Trophy,
  Award,
  Medal,
  Flag,
  Bookmark,
  Bell,
  BellOff,
  MessageCircle,
  Send,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Layers,
  Maximize,
  Minimize,
  RefreshCw,
  RotateCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Link2,
  Copy,
  Clipboard,
  FileText,
  Image,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Flashlight,
  FlashlightOff,
  Shield,
} from 'lucide-react';

export type IconName =
  | 'map'
  | 'map-pin'
  | 'camera'
  | 'wallet'
  | 'gift'
  | 'search'
  | 'x'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'chevron-down'
  | 'home'
  | 'qr-code'
  | 'menu'
  | 'settings'
  | 'user'
  | 'log-out'
  | 'check'
  | 'alert-circle'
  | 'info'
  | 'zap'
  | 'trending-up'
  | 'star'
  | 'heart'
  | 'share'
  | 'download'
  | 'upload'
  | 'loader'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'navigation'
  | 'target'
  | 'calendar'
  | 'clock'
  | 'dollar-sign'
  | 'credit-card'
  | 'receipt'
  | 'shopping-bag'
  | 'store'
  | 'coffee'
  | 'utensils'
  | 'film'
  | 'music'
  | 'gamepad'
  | 'sparkles'
  | 'trophy'
  | 'award'
  | 'medal'
  | 'flag'
  | 'bookmark'
  | 'bell'
  | 'bell-off'
  | 'message-circle'
  | 'send'
  | 'plus'
  | 'minus'
  | 'more-horizontal'
  | 'more-vertical'
  | 'filter'
  | 'sort-asc'
  | 'sort-desc'
  | 'grid'
  | 'list'
  | 'layers'
  | 'maximize'
  | 'minimize'
  | 'refresh'
  | 'rotate'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'external-link'
  | 'link'
  | 'copy'
  | 'clipboard'
  | 'file-text'
  | 'image'
  | 'video'
  | 'mic'
  | 'mic-off'
  | 'volume'
  | 'volume-x'
  | 'wifi'
  | 'wifi-off'
  | 'battery'
  | 'battery-low'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'cloud-rain'
  | 'wind'
  | 'thermometer'
  | 'droplets'
  | 'flashlight'
  | 'flashlight-off'
  | 'shield';

const REGISTRY: Record<IconName, any> = {
  map: MapIcon,
  'map-pin': MapPin,
  camera: Camera,
  wallet: Wallet,
  gift: Gift,
  search: Search,
  x: X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  home: Home,
  'qr-code': QrCode,
  menu: Menu,
  settings: Settings,
  user: User,
  'log-out': LogOut,
  check: Check,
  'alert-circle': AlertCircle,
  info: Info,
  zap: Zap,
  'trending-up': TrendingUp,
  star: Star,
  heart: Heart,
  share: Share2,
  download: Download,
  upload: Upload,
  loader: Loader2,
  eye: Eye,
  'eye-off': EyeOff,
  lock: Lock,
  unlock: Unlock,
  navigation: Navigation,
  target: Target,
  calendar: Calendar,
  clock: Clock,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  store: Store,
  coffee: Coffee,
  utensils: Utensils,
  film: Film,
  music: Music,
  gamepad: Gamepad,
  sparkles: Sparkles,
  trophy: Trophy,
  award: Award,
  medal: Medal,
  flag: Flag,
  bookmark: Bookmark,
  bell: Bell,
  'bell-off': BellOff,
  'message-circle': MessageCircle,
  send: Send,
  plus: Plus,
  minus: Minus,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  filter: Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  grid: Grid,
  list: List,
  layers: Layers,
  maximize: Maximize,
  minimize: Minimize,
  refresh: RefreshCw,
  rotate: RotateCw,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'external-link': ExternalLink,
  link: Link2,
  copy: Copy,
  clipboard: Clipboard,
  'file-text': FileText,
  image: Image,
  video: Video,
  mic: Mic,
  'mic-off': MicOff,
  volume: Volume2,
  'volume-x': VolumeX,
  wifi: Wifi,
  'wifi-off': WifiOff,
  battery: Battery,
  'battery-low': BatteryLow,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  wind: Wind,
  thermometer: Thermometer,
  droplets: Droplets,
  flashlight: Flashlight,
  'flashlight-off': FlashlightOff,
  shield: Shield,
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
 * Unified Icon component using lucide-react
 * Replaces all emoji usage with consistent SVG icons
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
    console.warn(`Icon "${name}" not found in registry`);
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
  Wallet,
  Gift,
  Search,
  QrCode,
  Home,
  Settings,
  User,
  Check,
  AlertCircle,
  Zap,
  Star,
  Heart,
  Trophy,
  Bell,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Minus,
};

export type Filter = {
  id: string;
  label: string;
  selected: boolean;
};

export type Offer = {
  id: string;
  title: string;
  brandName: string;
  brandLogo: string;
  coverUrl?: string | null;
  benefit?: string;
  conditions?: string[];
  validFrom?: Date | string;
  validUntil: Date | string; // API로 문자열 올 가능성 반영
  distance?: number | null;
  isNew?: boolean;
  status?: 'new' | 'expiring_soon' | string;
  places?: any[]; // 필요시 더 구체적인 타입으로 변경
};

export type Reel = {
  id: string;
  placeId: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  category: string;
  count?: number;
};

export type ScanResult = {
  kind: 'voucher' | 'checkin' | 'membership' | 'unknown';
  payload: string;
  timestamp: Date;
  voucherId?: string;
  placeId?: string;
};

export type ScanError = {
  code: string;
  message: string;
};

export type WalletSummary = {
  points: number;
  stamps: number;
  activeVouchers: number;
  expiringVouchers: number;
};

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
};

export type Pass = {
  id: string;
  placeId: string;
  title: string;
  benefit: string;
  price: number;
  originalPrice?: number;
  coverUrl: string;
  mediaUrls: string[];
  validUntil: Date | string;
  remainingCount?: number;
  category: string;
  terms: string[];
};

export type Voucher = {
  id: string;
  passId: string;
  pass: Pass;
  status: 'active' | 'reserved' | 'used' | 'expired' | 'expiring_soon';
  purchasedAt: Date | string;
  expiresAt: Date | string;
  usedAt?: Date | string;
  reservedUntil?: Date | string;
  qrCode?: string;
};
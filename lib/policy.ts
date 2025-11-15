// 삼중 검증 정책 (GPS·QR·영수증)
export const VerifyPolicy = {
  qr: {
    requireSignature: true,  // 서명된 QR만 허용
    expiryMs: 5 * 60_000,   // 5분 만료
  },
  geo: {
    defaultRadiusM: 120,     // 기본 지오펜스 반경
    maxAccuracyM: 100,       // 위치 정확도 허용치
  },
  receipt: {
    required: false,         // 운영 전환 시 true로 변경 (완전한 3중 검증)
  },
} as const;

export type Geofence = {
  center: { lat: number; lng: number };
  radius: number;
  distance?: number;
};

export type VerifyFail =
  | 'MALFORMED'
  | 'EXPIRED'
  | 'GEOFENCE'
  | 'SIGNATURE'
  | 'RULE';

export type VerifySuccess = {
  ok: true;
  missionId: string;
  nextAction: 'SETTLEMENT_ENQUEUED';
};

export type VerifyError = {
  ok: false;
  reason: VerifyFail;
  geofence?: Geofence;
};

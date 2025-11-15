export type OAuthProviderType = 'instagram' | 'tiktok' | 'google';
export type AuthMethod = 'oauth' | 'email' | 'phone' | 'guest';

export interface UserProfile {
  providerId?: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  followerCount?: number;
  instagramId?: string;
  tiktokId?: string;
  googleId?: string;
  isVerified?: boolean;
}

export interface SessionData {
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

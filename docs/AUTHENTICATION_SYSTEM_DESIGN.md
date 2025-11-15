# Authentication System Design - ZZIK LIVE

Complete authentication system design and implementation plan.

## 🎯 Overview

ZZIK LIVE implements a comprehensive, production-ready authentication system supporting:

1. **OAuth Social Login** (Instagram, TikTok, Google)
2. **Magic Link Email** (Passwordless)
3. **SMS OTP** (Phone verification)
4. **Guest Mode** (Browse without signup)

## 🏗️ Architecture

### Technology Stack

- **Session Storage**: Redis + PostgreSQL
- **Email Service**: Resend
- **SMS Service**: Twilio
- **Database ORM**: Prisma
- **Validation**: Zod
- **Rate Limiting**: Redis sorted sets

### Database Schema Updates

```prisma
model User {
  id            String   @id @default(cuid())
  nickname      String
  email         String?  @unique
  phone         String?  @unique
  avatarUrl     String?
  
  // OAuth IDs
  instagramId   String?  @unique
  tiktokId      String?  @unique
  googleId      String?  @unique
  
  // Metadata
  followerCount Int?
  isVerified    Boolean  @default(false)
  role          UserRole @default(CREATOR)
  
  // Relations
  sessions      Session[]
  authTokens    AuthToken[]
  // ... existing relations
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuthToken {
  id         String        @id @default(cuid())
  type       AuthTokenType
  token      String        @unique
  identifier String        // email or phone
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime      @default(now())
}

enum AuthTokenType {
  EMAIL_MAGIC_LINK
  SMS_OTP
  OAUTH_STATE
}

enum UserRole {
  CREATOR
  BUSINESS
  ADMIN
}
```

## 📁 Project Structure

```
lib/
├── auth/
│   ├── types.ts                    # TypeScript interfaces
│   ├── providers/
│   │   ├── instagram.ts            # Instagram OAuth config
│   │   ├── tiktok.ts               # TikTok OAuth config
│   │   └── google.ts               # Google OAuth config
│   └── services/
│       ├── session-service.ts      # Session management (Redis + PostgreSQL)
│       ├── token-service.ts        # Token generation/verification
│       └── user-service.ts         # User CRUD operations
├── email/
│   └── resend-client.ts            # Email service (magic links)
├── sms/
│   └── twilio-client.ts            # SMS service (OTP)
├── security/
│   └── rate-limiter.ts             # Rate limiting (Redis)
├── prisma.ts                       # Prisma client singleton
└── redis.ts                        # Redis client singleton
```

## 🔐 Authentication Flows

### 1. OAuth Flow (Instagram/TikTok/Google)

```
User clicks "Login with Instagram"
    ↓
Generate CSRF state token → Store in Redis
    ↓
Redirect to Instagram authorization URL
    ↓
User authorizes → Instagram redirects back with code
    ↓
Verify state token (CSRF protection)
    ↓
Exchange code for access token
    ↓
Fetch user profile from Instagram API
    ↓
Create or update User in database
    ↓
Create Session (Redis + PostgreSQL)
    ↓
Set httpOnly session cookie → Redirect to /pass
```

### 2. Magic Link Flow (Email)

```
User enters email → Request magic link
    ↓
Rate limit check (3 per 15 min per email)
    ↓
Generate secure token (crypto.randomBytes)
    ↓
Store token in Redis (15 min TTL) + PostgreSQL
    ↓
Send email via Resend with magic link
    ↓
User clicks link → Verify token
    ↓
Mark token as used (one-time use)
    ↓
Create or find User by email
    ↓
Create Session → Set cookie → Redirect to /pass
```

### 3. SMS OTP Flow (Phone)

```
User enters phone → Request OTP
    ↓
Rate limit check (3 per 15 min per phone)
    ↓
Generate 6-digit OTP code
    ↓
Store OTP in Redis (5 min TTL)
    ↓
Send SMS via Twilio
    ↓
User enters OTP → Verify code
    ↓
Delete OTP from Redis (one-time use)
    ↓
Create or find User by phone
    ↓
Create Session → Set cookie → Redirect to /pass
```

## 🔒 Security Features

### Session Management

- **Storage**: Redis (fast lookup) + PostgreSQL (persistent)
- **Token**: 32-byte random nanoid
- **TTL**: 7 days with sliding window
- **httpOnly**: Yes (XSS protection)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Lax (CSRF protection)

### Rate Limiting

Implemented with Redis sorted sets (sliding window):

- **Login attempts**: 5 per 15 minutes per IP
- **Magic link**: 3 per 15 minutes per email
- **OTP**: 3 per 15 minutes per phone
- **API calls**: 100 per minute per user

### CSRF Protection

- OAuth state tokens (10-minute TTL)
- httpOnly + SameSite cookies
- Request origin validation

### Input Validation

- Zod schemas for all API inputs
- Email format validation
- Phone number format (Korean: 010-XXXX-XXXX)
- XSS prevention (React auto-escaping)
- SQL injection prevention (Prisma parameterized queries)

## 🌐 API Routes

### OAuth Routes

```
GET  /api/auth/instagram          → Redirect to Instagram OAuth
GET  /api/auth/instagram/callback → Handle OAuth callback
GET  /api/auth/tiktok             → Redirect to TikTok OAuth
GET  /api/auth/tiktok/callback    → Handle OAuth callback
GET  /api/auth/google             → Redirect to Google OAuth
GET  /api/auth/google/callback    → Handle OAuth callback
```

### Magic Link Routes

```
POST /api/auth/magic-link         → Send magic link email
GET  /api/auth/magic-link/verify  → Verify token & create session
```

### OTP Routes

```
POST /api/auth/otp/send           → Send OTP SMS
POST /api/auth/otp/verify         → Verify OTP code & create session
```

### Session Routes

```
POST /api/auth/logout             → Delete session
GET  /api/auth/me                 → Get current user
```

## 🔧 Environment Variables

```bash
# OAuth Providers
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email Service (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM="ZZIK LIVE <auth@zziklive.com>"

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1234567890

# Infrastructure
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
SESSION_SECRET=  # 32 chars (openssl rand -hex 32)
ENCRYPTION_KEY=  # 32 chars (openssl rand -hex 32)
```

## 🧪 Testing Strategy

### Unit Tests

- Session service (create, get, delete, refresh)
- Token service (generation, verification)
- User service (create, update, find)
- Rate limiter (sliding window algorithm)

### Integration Tests

- OAuth flow end-to-end
- Magic link email delivery
- OTP SMS delivery
- Session persistence

### E2E Tests (Playwright)

- Complete login flows
- Guest mode navigation
- Protected route access
- Logout functionality

## 📊 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Update Prisma schema
- ✅ Implement session service
- ✅ Implement token service
- ✅ Implement rate limiter
- ✅ Set up Redis & PostgreSQL connections

### Phase 2: OAuth Integration (Week 2)
- ⏳ Instagram OAuth flow
- ⏳ TikTok OAuth flow  
- ⏳ Google OAuth flow
- ⏳ Profile mapping & user creation

### Phase 3: Email & SMS (Week 3)
- ⏳ Resend email integration
- ⏳ Magic link generation/verification
- ⏳ Twilio SMS integration
- ⏳ OTP generation/verification

### Phase 4: Security & Testing (Week 4)
- ⏳ Middleware implementation
- ⏳ Security headers
- ⏳ Unit tests
- ⏳ Integration tests
- ⏳ E2E tests

### Phase 5: Deployment (Week 5)
- ⏳ Production environment setup
- ⏳ Migration execution
- ⏳ Monitoring & logging
- ⏳ Documentation

## 📚 Additional Documentation

For detailed implementation guides, see:

- `docs/AUTH_IMPLEMENTATION_PLAN.md` - Step-by-step implementation
- `docs/AUTH_SYSTEM_DESIGN.md` - Full system design (25,000+ words)
- `lib/auth/types.ts` - TypeScript type definitions

## 🎯 Success Criteria

- [ ] All OAuth providers functional
- [ ] Magic link delivery < 5 seconds
- [ ] SMS OTP delivery < 10 seconds
- [ ] Session persistence working
- [ ] Rate limiting preventing abuse
- [ ] Middleware protecting routes
- [ ] All tests passing
- [ ] Production deployed
- [ ] Monitoring active

---

**Status**: Design complete, implementation in progress
**Last updated**: 2024-11-14
**Next steps**: Phase 2 - OAuth Integration
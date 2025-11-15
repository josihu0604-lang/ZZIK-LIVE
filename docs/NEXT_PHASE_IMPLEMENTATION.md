# Next Phase Implementation Plan

Detailed implementation roadmap for ZZIK-LIVE authentication system Phase 2-5.

## 📊 Current Status Analysis

### ✅ Completed (Phase 1 - Design)
- [x] Authentication system architecture design
- [x] Database schema design (User, Session, AuthToken models)
- [x] Type definitions (`lib/auth/types.ts`)
- [x] Login UI page (`app/auth/login/page.tsx`)
- [x] Comprehensive documentation

### 🚧 In Progress
- [ ] OAuth provider implementations
- [ ] Service layer implementations
- [ ] API route handlers

### ⏳ Not Started
- [ ] Email/SMS integrations
- [ ] Testing infrastructure
- [ ] Production deployment

---

## 🎯 Priority Matrix

### High Priority (Must Have - Week 1-2)
1. **Core Services Implementation**
   - Session Service (Redis + PostgreSQL)
   - Token Service (Magic Link + OTP)
   - User Service (CRUD operations)

2. **OAuth Integration**
   - Instagram OAuth flow
   - Google OAuth flow (TikTok can wait)

3. **Rate Limiting**
   - Redis-based rate limiter
   - Middleware integration

### Medium Priority (Should Have - Week 3)
4. **Email Integration**
   - Resend setup
   - Magic link emails

5. **Middleware & Guards**
   - Authentication middleware
   - Route protection

6. **Basic Testing**
   - Unit tests for services
   - Integration tests for OAuth

### Low Priority (Nice to Have - Week 4-5)
7. **SMS Integration**
   - Twilio setup (can use dev mode initially)

8. **TikTok OAuth**
   - Complex approval process

9. **E2E Testing**
   - Playwright test suite

---

## 📅 Phase 2: Core Services & OAuth (Week 1-2)

### Step 1: Environment Setup

#### 1.1 Install Dependencies

```bash
# Navigate to project
cd /home/user/webapp

# Install authentication dependencies
npm install ioredis nanoid resend twilio

# Install dev dependencies
npm install --save-dev @types/node tsx

# Verify installations
npm list ioredis nanoid resend
```

#### 1.2 Update Environment Variables

Create `.env.local`:

```bash
# Database & Redis
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zzik"
REDIS_URL="redis://localhost:6379"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# OAuth - Instagram (Get from: https://developers.facebook.com/apps/)
INSTAGRAM_CLIENT_ID="your_instagram_client_id"
INSTAGRAM_CLIENT_SECRET="your_instagram_client_secret"

# OAuth - Google (Get from: https://console.cloud.google.com/)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# OAuth - TikTok (Optional for now)
TIKTOK_CLIENT_KEY="your_tiktok_client_key"
TIKTOK_CLIENT_SECRET="your_tiktok_client_secret"

# Email - Resend (Get from: https://resend.com/)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="ZZIK LIVE <auth@zziklive.com>"

# SMS - Twilio (Optional for now)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Security (Generate with: openssl rand -hex 32)
SESSION_SECRET="generate_32_char_random_string"
ENCRYPTION_KEY="generate_32_char_random_string"
```

#### 1.3 Update Prisma Schema

The schema has already been designed. Apply migrations:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create migration
npx prisma migrate dev --name add_auth_system

# Verify in Prisma Studio
npx prisma studio
```

### Step 2: Implement Core Services

#### 2.1 Redis Client (Already exists, verify)

File: `lib/redis.ts`

Verify it's working:
```typescript
// test-redis.ts
import { redis } from './lib/redis';

async function testRedis() {
  await redis.set('test', 'hello');
  const value = await redis.get('test');
  console.log('Redis test:', value);
  await redis.del('test');
  process.exit(0);
}

testRedis();
```

Run: `npx tsx test-redis.ts`

#### 2.2 Session Service Implementation

File: `lib/auth/services/session-service.ts`

**Key Functions:**
- `createSession(params)` - Create new session
- `getSession(token)` - Retrieve session by token
- `deleteSession(token)` - Delete session (logout)
- `refreshSession(token)` - Extend session lifetime
- `deleteAllUserSessions(userId)` - Logout from all devices

**Implementation Priority:** 🔴 HIGH
**Dependencies:** Redis, Prisma, nanoid
**Estimated Time:** 4 hours

#### 2.3 Token Service Implementation

File: `lib/auth/services/token-service.ts`

**Key Functions:**
- `generateMagicToken(email)` - Generate email magic link token
- `verifyMagicToken(token)` - Verify and consume magic link
- `generateOTP()` - Generate 6-digit OTP
- `saveOTP(phone, otp, ttl)` - Store OTP in Redis
- `verifyOTP(phone, otp)` - Verify OTP code
- `generateOAuthState(provider)` - CSRF protection
- `verifyOAuthState(state, provider)` - Validate OAuth state

**Implementation Priority:** 🔴 HIGH
**Dependencies:** crypto, Redis, Prisma
**Estimated Time:** 4 hours

#### 2.4 User Service Implementation

File: `lib/auth/services/user-service.ts`

**Key Functions:**
- `createOrUpdateUser(params)` - Create/update user from auth
- `getUserById(userId)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `getUserByPhone(phone)` - Get user by phone
- `updateUserProfile(userId, data)` - Update profile
- `deleteUser(userId)` - Delete account

**Implementation Priority:** 🔴 HIGH
**Dependencies:** Prisma
**Estimated Time:** 3 hours

#### 2.5 Rate Limiter Implementation

File: `lib/security/rate-limiter.ts`

**Already partially exists:** `lib/server/rate-limit.ts`

Enhance with:
- Sliding window algorithm
- Redis sorted sets
- Multiple rate limit configs
- `RateLimiter` class with `check()` method

**Implementation Priority:** 🔴 HIGH
**Dependencies:** Redis
**Estimated Time:** 2 hours

### Step 3: OAuth Provider Implementations

#### 3.1 Instagram OAuth

**Files to create:**
1. `lib/auth/providers/instagram.ts` - Config & helpers
2. `app/api/auth/instagram/route.ts` - Authorization endpoint
3. `app/api/auth/instagram/callback/route.ts` - Callback handler

**Flow:**
```
User clicks "Instagram" button
  ↓
GET /api/auth/instagram
  ↓
Generate state token → Store in Redis
  ↓
Redirect to Instagram OAuth URL
  ↓
User authorizes on Instagram
  ↓
Instagram redirects to /api/auth/instagram/callback?code=xxx&state=yyy
  ↓
Verify state (CSRF protection)
  ↓
Exchange code for access token
  ↓
Fetch user profile from Instagram API
  ↓
Create/update User in database
  ↓
Create Session
  ↓
Set httpOnly cookie
  ↓
Redirect to /pass (or next param)
```

**Implementation Priority:** 🔴 HIGH
**Estimated Time:** 6 hours (including Instagram app setup & testing)

**Instagram App Setup:**
1. Go to https://developers.facebook.com/apps/
2. Create new app → Select "Business"
3. Add product: "Instagram Basic Display"
4. Configure OAuth Redirect URIs: `http://localhost:3000/api/auth/instagram/callback`
5. Copy Client ID and Client Secret

#### 3.2 Google OAuth

**Files to create:**
1. `lib/auth/providers/google.ts` - Config & helpers
2. `app/api/auth/google/route.ts` - Authorization endpoint
3. `app/api/auth/google/callback/route.ts` - Callback handler

**Flow:** Same as Instagram

**Implementation Priority:** 🔴 HIGH
**Estimated Time:** 4 hours

**Google OAuth Setup:**
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret

#### 3.3 TikTok OAuth (Optional - Week 3)

**Implementation Priority:** 🟡 MEDIUM
**Note:** TikTok app approval can take weeks. Skip for MVP.

### Step 4: Update Existing OAuth API Routes

#### Current Files (Need Updates):
- `app/api/auth/instagram/route.ts` - Currently has placeholder
- `app/api/auth/tiktok/route.ts` - Currently has placeholder
- `app/api/auth/google/route.ts` - Currently has placeholder

**Replace with full implementations using:**
- OAuth provider configs
- State token generation
- Session creation
- User creation/update

### Step 5: Testing Core Services

#### 5.1 Unit Tests

Create `tests/unit/auth/` directory:

```typescript
// tests/unit/auth/session-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSession, getSession, deleteSession } from '@/lib/auth/services/session-service';

describe('Session Service', () => {
  let sessionToken: string;
  
  beforeEach(async () => {
    // Setup
  });
  
  afterEach(async () => {
    // Cleanup
    if (sessionToken) {
      await deleteSession(sessionToken);
    }
  });
  
  it('should create a session', async () => {
    const session = await createSession({
      userId: 'test-user-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
    });
    
    expect(session).toBeDefined();
    expect(session.token).toBeDefined();
    expect(session.userId).toBe('test-user-123');
    
    sessionToken = session.token;
  });
  
  it('should retrieve a session', async () => {
    const created = await createSession({
      userId: 'test-user-456',
      ipAddress: '127.0.0.1',
      userAgent: 'Test',
    });
    
    const retrieved = await getSession(created.token);
    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe('test-user-456');
    
    await deleteSession(created.token);
  });
  
  it('should return null for invalid token', async () => {
    const session = await getSession('invalid-token');
    expect(session).toBeNull();
  });
  
  it('should delete a session', async () => {
    const created = await createSession({
      userId: 'test-user-789',
      ipAddress: '127.0.0.1',
      userAgent: 'Test',
    });
    
    await deleteSession(created.token);
    
    const retrieved = await getSession(created.token);
    expect(retrieved).toBeNull();
  });
});
```

Run: `npm test -- session-service.test.ts`

#### 5.2 Integration Tests

Create `tests/integration/auth/` directory:

```typescript
// tests/integration/auth/oauth-flow.test.ts
import { describe, it, expect } from 'vitest';

describe('OAuth Flow Integration', () => {
  it('should have valid Instagram config', () => {
    expect(process.env.INSTAGRAM_CLIENT_ID).toBeDefined();
    expect(process.env.INSTAGRAM_CLIENT_SECRET).toBeDefined();
  });
  
  it('should generate valid authorization URL', async () => {
    const response = await fetch('http://localhost:3000/api/auth/instagram', {
      redirect: 'manual',
    });
    
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('instagram.com');
  });
});
```

---

## 📅 Phase 3: Email & SMS Integration (Week 3)

### Step 1: Resend Email Service

#### 1.1 Setup Resend Account

1. Sign up at https://resend.com/
2. Verify your sending domain
3. Generate API key
4. Add to `.env.local`

#### 1.2 Implement Email Service

File: `lib/email/resend-client.ts`

```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  nickname?: string
) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: [email],
    subject: 'ZZIK LIVE 로그인 링크',
    html: getMagicLinkEmailTemplate(magicLink, nickname),
  });
  
  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
  
  return data;
}

function getMagicLinkEmailTemplate(link: string, nickname?: string) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #0F172A; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background: #10B981; 
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
    }
  </style>
</head>
<body>
  <h1>ZZIK LIVE 로그인</h1>
  ${nickname ? `<p>${nickname}님, 안녕하세요!</p>` : '<p>안녕하세요!</p>'}
  <p>아래 버튼을 클릭하여 로그인하세요. 링크는 15분간 유효합니다.</p>
  <a href="${link}" class="button">로그인하기</a>
  <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
    로그인을 요청하지 않으셨다면 이 이메일을 무시하세요.
  </p>
</body>
</html>
  `;
}
```

#### 1.3 Magic Link API Routes

**Send Magic Link:**
File: `app/api/auth/magic-link/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMagicToken } from '@/lib/auth/services/token-service';
import { sendMagicLinkEmail } from '@/lib/email/resend-client';
import { rateLimiter, RateLimitConfigs } from '@/lib/security/rate-limiter';

const emailSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await rateLimiter.check(
      `magic-link:${ip}`,
      RateLimitConfigs.MAGIC_LINK.maxRequests,
      RateLimitConfigs.MAGIC_LINK.windowSeconds
    ))) {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { email } = emailSchema.parse(body);
    
    // Generate token
    const token = await generateMagicToken(email);
    
    // Build magic link
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/magic-link/verify?token=${token}`;
    
    // Send email
    await sendMagicLinkEmail(email, magicLink);
    
    return NextResponse.json({
      success: true,
      message: '로그인 링크가 이메일로 전송되었습니다.',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: '이메일 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

**Verify Magic Link:**
File: `app/api/auth/magic-link/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth/services/token-service';
import { createOrUpdateUser } from '@/lib/auth/services/user-service';
import { createSession } from '@/lib/auth/services/session-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect('/auth/login?error=invalid_token');
  }
  
  try {
    // Verify token
    const { email } = await verifyMagicToken(token);
    
    // Create/find user
    const user = await createOrUpdateUser({
      provider: 'email',
      profile: { email, nickname: email.split('@')[0] },
    });
    
    // Create session
    const session = await createSession({
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    // Set cookie and redirect
    const response = NextResponse.redirect('/pass');
    response.cookies.set('zzik_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.redirect('/auth/login?error=expired_token');
  }
}
```

### Step 2: Twilio SMS Service (Optional)

Skip for now or use in dev mode with console logging.

---

## 📅 Phase 4: Middleware & Security (Week 4)

### Step 1: Authentication Middleware

File: `middleware.ts` (already exists, enhance)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/services/session-service';

const PROTECTED_ROUTES = ['/wallet', '/scan', '/offers/accept'];
const PUBLIC_ROUTES = ['/auth', '/legal', '/splash', '/pass'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const sessionToken = request.cookies.get('zzik_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.redirect(
        new URL(`/auth/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }
    
    const session = await getSession(sessionToken);
    
    if (!session) {
      const response = NextResponse.redirect(
        new URL('/auth/login?error=session_expired', request.url)
      );
      response.cookies.delete('zzik_session');
      return response;
    }
    
    // Add user ID to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
```

### Step 2: API Route Guards

Create helper: `lib/auth/guards.ts`

```typescript
import { NextRequest } from 'next/server';
import { getSession } from './services/session-service';

export async function requireAuth(request: NextRequest) {
  const sessionToken = request.cookies.get('zzik_session')?.value;
  
  if (!sessionToken) {
    throw new Error('Unauthorized');
  }
  
  const session = await getSession(sessionToken);
  
  if (!session) {
    throw new Error('Invalid or expired session');
  }
  
  return session;
}

export async function optionalAuth(request: NextRequest) {
  const sessionToken = request.cookies.get('zzik_session')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  return await getSession(sessionToken);
}
```

Usage in API routes:

```typescript
// app/api/protected-route/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    // Session is valid, user is authenticated
    return NextResponse.json({
      userId: session.userId,
      data: '...'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

## 📅 Phase 5: Testing & Deployment (Week 5)

### Step 1: E2E Tests with Playwright

Create `tests/e2e/auth/` directory:

```typescript
// tests/e2e/auth/login-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('ZZIK LIVE 로그인');
  });
  
  test('should have social login buttons', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.locator('text=Instagram으로 계속')).toBeVisible();
    await expect(page.locator('text=Google로 계속')).toBeVisible();
  });
  
  test('should allow guest browsing', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=둘러보기');
    
    // Should redirect to feed
    await expect(page).toHaveURL(/\/feed/);
  });
  
  test('should send magic link email', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Open email form
    await page.click('summary:has-text("기타 방법")');
    
    // Fill email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Submit
    await page.click('button:has-text("로그인 링크 받기")');
    
    // Check success message
    await expect(page.locator('text=이메일로 전송')).toBeVisible();
  });
});
```

Run: `npx playwright test`

### Step 2: Production Checklist

#### Database
- [ ] Run migrations on production DB
- [ ] Set up database backups
- [ ] Configure connection pooling

#### Redis
- [ ] Set up production Redis instance
- [ ] Configure persistence
- [ ] Set up monitoring

#### Environment Variables
- [ ] All OAuth credentials in production
- [ ] Resend API key
- [ ] Strong session secrets (32+ chars)
- [ ] HTTPS URLs

#### Security
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers

#### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Log authentication events
- [ ] Monitor rate limit hits
- [ ] Track OAuth success/failure rates

---

## 🔄 Implementation Order Summary

### Week 1: Core Foundation
1. ✅ Environment setup
2. ✅ Prisma migration
3. ✅ Session Service
4. ✅ Token Service
5. ✅ User Service
6. ✅ Rate Limiter

### Week 2: OAuth Integration
7. ✅ Instagram OAuth complete flow
8. ✅ Google OAuth complete flow
9. ✅ Update login page API calls
10. ✅ Test OAuth flows manually

### Week 3: Email & Middleware
11. ✅ Resend email service
12. ✅ Magic link routes
13. ✅ Authentication middleware
14. ✅ API route guards

### Week 4: Testing
15. ✅ Unit tests (services)
16. ✅ Integration tests (OAuth)
17. ✅ E2E tests (login flows)
18. ✅ Fix bugs from testing

### Week 5: Polish & Deploy
19. ✅ Security audit
20. ✅ Performance optimization
21. ✅ Documentation updates
22. ✅ Production deployment

---

## 📝 Quick Start Commands

```bash
# Install dependencies
npm install ioredis nanoid resend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_auth_system

# Test Redis connection
npx tsx scripts/test-redis.ts

# Run unit tests
npm test

# Run E2E tests
npx playwright test

# Start dev server
npm run dev
```

---

## 🎯 Success Metrics

- [ ] All OAuth providers working (Instagram, Google)
- [ ] Magic link delivery < 5 seconds
- [ ] Session persistence across refreshes
- [ ] Rate limiting preventing abuse (verified with tests)
- [ ] Middleware protecting routes correctly
- [ ] 90%+ test coverage on auth services
- [ ] All E2E tests passing
- [ ] Zero production errors in first week

---

**Next Action**: Start Week 1 with core services implementation

Last updated: 2024-11-14
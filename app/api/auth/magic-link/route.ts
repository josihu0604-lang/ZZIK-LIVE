import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRequestId, log } from '@/lib/server/logger';
import { checkAndConsume, addRateHeaders } from '@/lib/server/rate-limit';
import { nanoid } from 'nanoid';

const MagicLinkSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    // Rate limiting - 5 requests per minute per IP
    const rateLimitResult = checkAndConsume(`magic-link:${clientIp}`, 5);

    if (!rateLimitResult.ok) {
      log('warn', 'Rate limit exceeded for magic link', {
        requestId,
        clientIp,
      });

      const res = NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          requestId,
        },
        { status: 429 }
      );

      return addRateHeaders(
        res,
        5,
        rateLimitResult.remaining,
        rateLimitResult.reset_ms
      );
    }

    const body = await req.json();
    const { email } = MagicLinkSchema.parse(body);

    // Generate magic link token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // TODO: Store token in database
    // await prisma.magicLinkToken.create({
    //   data: {
    //     token,
    //     email,
    //     expiresAt,
    //   },
    // });

    // TODO: Send email
    // await sendEmail({
    //   to: email,
    //   subject: 'Sign in to ZZIK LIVE',
    //   html: `Click here to sign in: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`,
    // });

    log('info', 'Magic link sent', {
      requestId,
      email: email.slice(0, 3) + '***', // Partial masking for privacy
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Magic link sent to your email',
        requestId,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      log('warn', 'Invalid request body', {
        requestId,
        errorCount: error.issues.length,
      });

      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid email address',
          requestId,
        },
        { status: 400 }
      );
    }

    log('error', 'Magic link error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An error occurred. Please try again.',
        requestId,
      },
      { status: 500 }
    );
  }
}

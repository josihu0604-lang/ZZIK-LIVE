// app/api/auth/tiktok/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}

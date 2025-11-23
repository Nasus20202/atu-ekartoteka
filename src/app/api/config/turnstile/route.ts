import { NextResponse } from 'next/server';

export async function GET() {
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  const enabled = !!(siteKey && secretKey);

  return NextResponse.json({
    siteKey: siteKey || null,
    enabled,
  });
}

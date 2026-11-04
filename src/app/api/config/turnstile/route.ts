/* eslint-disable local/require-api-auth-guard -- Public Turnstile site key, needed before login */
import { connection, NextResponse } from 'next/server';

export async function GET() {
  // Runtime env must not be frozen into a build-time prerender
  await connection();

  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  const enabled = !!(siteKey && secretKey);

  return NextResponse.json({
    siteKey: siteKey || null,
    enabled,
  });
}

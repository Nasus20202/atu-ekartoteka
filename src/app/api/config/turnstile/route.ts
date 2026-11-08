/* eslint-disable local/require-api-auth-guard -- Public Turnstile site key, needed before login */
import { connection, NextResponse } from 'next/server';

const CACHE_CONTROL_HEADER = 'public, max-age=300';

export async function GET() {
  // Runtime env must not be frozen into a build-time prerender
  await connection();

  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  const enabled = !!(siteKey && secretKey);

  return NextResponse.json(
    {
      siteKey: siteKey || null,
      enabled,
    },
    { headers: { 'Cache-Control': CACHE_CONTROL_HEADER } }
  );
}

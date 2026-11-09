/* eslint-disable local/require-api-auth-guard -- Reveals only whether Google sign-in is enabled, needed before login */
import { connection, NextResponse } from 'next/server';

const CACHE_CONTROL_HEADER = 'public, max-age=300';

export async function GET() {
  // Runtime env must not be frozen into a build-time prerender
  await connection();

  const enabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json(
    { enabled },
    { headers: { 'Cache-Control': CACHE_CONTROL_HEADER } }
  );
}

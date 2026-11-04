/* eslint-disable local/require-api-auth-guard -- Serves the operator's analytics snippet to every visitor, so it must be public */
import { connection } from 'next/server';

const TRACKING_CACHE_SECONDS = 60 * 60;

/**
 * Serves the operator's analytics snippet as a same-origin script, so pages
 * can reference it without inlining code and stay statically rendered.
 */
export async function GET() {
  // Runtime env must not be frozen into a build-time prerender
  await connection();

  return new Response(process.env.TRACKING_SCRIPT ?? '', {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': `public, max-age=${TRACKING_CACHE_SECONDS}`,
    },
  });
}

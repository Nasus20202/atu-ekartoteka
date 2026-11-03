import { connection, NextResponse } from 'next/server';

export async function GET() {
  // Runtime env must not be frozen into a build-time prerender
  await connection();

  const enabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({ enabled });
}

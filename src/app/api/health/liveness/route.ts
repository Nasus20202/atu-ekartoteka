import { NextResponse } from 'next/server';

/**
 * Liveness probe endpoint
 * Indicates whether the application is running
 * Should return 200 if the process is alive
 * Does not check external dependencies
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

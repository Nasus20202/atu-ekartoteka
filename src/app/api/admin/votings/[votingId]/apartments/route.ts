import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { createLogger } from '@/lib/platform/logging/logger';
import { toMeetingApartmentDto } from '@/lib/voting/dto/meeting-apartment-dto';
import { findMeetingBallotApartments } from '@/lib/voting/queries/find-meeting-ballot-apartments';

const logger = createLogger('api:admin:voting-apartments');

interface Context {
  params: Promise<{ votingId: string }>;
}

/** Apartments an admin can still enter a meeting ballot for. */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { votingId } = await params;
    const search = new URL(req.url).searchParams.get('search') ?? '';
    const apartments = await findMeetingBallotApartments(votingId, search);

    return NextResponse.json({
      apartments: apartments.map(toMeetingApartmentDto),
    });
  } catch (error) {
    logger.error({ error }, 'Voting apartments fetch error');
    return NextResponse.json(
      { error: 'Nie udało się pobrać lokali' },
      { status: 500 }
    );
  }
}

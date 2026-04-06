import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { assignApartmentsToUser } from '@/lib/mutations/apartments/assign-apartments-to-user';
import { findUnassignedApartmentsForAssign } from '@/lib/queries/apartments/find-unassigned-apartments-for-assign';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:users:bulk-assign');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const body = await request.json();
    const { apartmentIds } = body as { apartmentIds: string[] };

    if (!Array.isArray(apartmentIds) || apartmentIds.length === 0) {
      return NextResponse.json(
        { error: 'apartmentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const apartments = await findUnassignedApartmentsForAssign(apartmentIds);

    // Deduplicate by email: one existing user may cover multiple apartments
    const emailMap = new Map<string, string[]>();
    for (const apt of apartments) {
      const email = apt.email!;
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(apt.id);
    }

    let assigned = 0;
    let skipped = 0;
    let errors = 0;

    for (const [email, aptIds] of emailMap.entries()) {
      try {
        const existingUser = await findUserByEmail(email);

        if (!existingUser) {
          skipped += aptIds.length;
          logger.info({ email }, 'No existing user found, skipping');
          continue;
        }

        const count = await assignApartmentsToUser(existingUser.id, aptIds);
        assigned += count;
        skipped += aptIds.length - count;

        logger.info(
          { email, aptCount: aptIds.length },
          'Assigned existing user to apartments'
        );
      } catch (err) {
        errors += aptIds.length;
        logger.error({ err, email }, 'Failed to assign existing user');
      }
    }

    return NextResponse.json({ assigned, skipped, errors });
  } catch (error) {
    logger.error({ error }, 'Bulk assign failed');
    return NextResponse.json(
      { error: 'Failed to process bulk assign' },
      { status: 500 }
    );
  }
}

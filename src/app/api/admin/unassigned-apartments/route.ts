import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { findAssignedApartmentAddressKeys } from '@/lib/queries/apartments/find-assigned-apartment-address-keys';
import { findUnassignedApartments } from '@/lib/queries/apartments/find-unassigned-apartments';
import { findAllUserEmails } from '@/lib/queries/users/find-all-user-emails';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:unassigned-apartments');

const UNASSIGNED_MODE_CREATABLE = 'creatable';
const UNASSIGNED_MODE_ASSIGNABLE = 'assignable';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode') ?? UNASSIGNED_MODE_CREATABLE;

    const existingUsers = await findAllUserEmails();
    const existingEmails = existingUsers.map((u) => u.email);

    // assignable: apartments whose email matches an existing user
    // creatable (default): apartments whose email is NOT yet used by any user
    const emailWhere =
      mode === UNASSIGNED_MODE_ASSIGNABLE
        ? { in: existingEmails }
        : { notIn: existingEmails };

    const [apartments, assignedKeys] = await Promise.all([
      findUnassignedApartments(emailWhere),
      findAssignedApartmentAddressKeys(),
    ]);

    // Build a set of "hoaId__building__number" keys for already-occupied apartments
    const occupiedAddressKeys = new Set(
      assignedKeys.map((k) => `${k.hoaId}__${k.building ?? ''}__${k.number}`)
    );

    // Tag apartments whose address is occupied by another apartment with a tenant
    const taggedApartments = apartments.map((apt) => ({
      ...apt,
      hasTwinWithTenant: occupiedAddressKeys.has(
        `${apt.homeownersAssociation.id}__${apt.building ?? ''}__${apt.number}`
      ),
    }));

    // Group by HOA
    const hoaMap = new Map<
      string,
      { hoaId: string; hoaName: string; apartments: typeof taggedApartments }
    >();

    for (const apt of taggedApartments) {
      const hoaId = apt.homeownersAssociation.id;
      if (!hoaMap.has(hoaId)) {
        hoaMap.set(hoaId, {
          hoaId,
          hoaName: apt.homeownersAssociation.name,
          apartments: [],
        });
      }
      hoaMap.get(hoaId)!.apartments.push(apt);
    }

    // Sort apartments within each HOA numerically by building then number
    for (const group of hoaMap.values()) {
      group.apartments.sort((a, b) => {
        const buildingA = parseInt(a.building ?? '0', 10);
        const buildingB = parseInt(b.building ?? '0', 10);
        if (buildingA !== buildingB) return buildingA - buildingB;
        return parseInt(a.number, 10) - parseInt(b.number, 10);
      });
    }

    logger.info(
      { hoaCount: hoaMap.size, apartmentCount: apartments.length, mode },
      'Fetched unassigned apartments'
    );

    return NextResponse.json({ hoas: Array.from(hoaMap.values()) });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch unassigned apartments');
    return NextResponse.json(
      { error: 'Failed to fetch unassigned apartments' },
      { status: 500 }
    );
  }
}

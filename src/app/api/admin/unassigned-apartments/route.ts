import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { findAssignedApartmentAddressKeys } from '@/lib/queries/apartments/find-assigned-apartment-address-keys';
import { findHoasWithUnassignedApartments } from '@/lib/queries/apartments/find-hoas-with-unassigned-apartments';
import { findUnassignedApartments } from '@/lib/queries/apartments/find-unassigned-apartments';
import { findAllUserEmails } from '@/lib/queries/users/find-all-user-emails';

const logger = createLogger('api:admin:unassigned-apartments');

const UNASSIGNED_MODE_CREATABLE = 'creatable';
const UNASSIGNED_MODE_ASSIGNABLE = 'assignable';
const DEFAULT_HOAS_PER_PAGE = 10;
const MAX_HOAS_PER_PAGE = 100;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = parseInt(value ?? '', 10);
  return parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode') ?? UNASSIGNED_MODE_CREATABLE;
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(
      parsePositiveInt(searchParams.get('limit'), DEFAULT_HOAS_PER_PAGE),
      MAX_HOAS_PER_PAGE
    );

    const existingUsers = await findAllUserEmails();
    const existingEmails = existingUsers.map((u) => u.email);

    // assignable: apartments whose email matches an existing user
    // creatable (default): apartments whose email is NOT yet used by any user
    const emailWhere =
      mode === UNASSIGNED_MODE_ASSIGNABLE
        ? { in: existingEmails }
        : { notIn: existingEmails };

    // Pages are made of whole HOAs, so twin and shared-email groups never split
    const [hoaPage, totalHoas] = await findHoasWithUnassignedApartments(
      emailWhere,
      { skip: (page - 1) * limit, limit }
    );
    const hoaIds = hoaPage.map((hoa) => hoa.id);

    const [apartments, assignedKeys] = await Promise.all([
      findUnassignedApartments(emailWhere, hoaIds),
      findAssignedApartmentAddressKeys(hoaIds),
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

    logger.info(
      { hoaCount: hoaMap.size, apartmentCount: apartments.length, mode, page },
      'Fetched unassigned apartments'
    );

    return NextResponse.json({
      hoas: Array.from(hoaMap.values()),
      pagination: {
        page,
        limit,
        total: totalHoas,
        totalPages: Math.ceil(totalHoas / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Nie udało się pobrać nieprzypisanych mieszkań');
    return NextResponse.json(
      { error: 'Nie udało się pobrać nieprzypisanych mieszkań' },
      { status: 500 }
    );
  }
}

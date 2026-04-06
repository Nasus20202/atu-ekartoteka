import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { updateHoaName } from '@/lib/mutations/hoa/update-hoa-name';
import { findHoas } from '@/lib/queries/hoa/find-hoas';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:hoa');

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const homeownersAssociations = await findHoas(search);

    return NextResponse.json({
      homeownersAssociations: homeownersAssociations.map(
        (hoa: (typeof homeownersAssociations)[number]) => ({
          id: hoa.id,
          externalId: hoa.externalId,
          name: hoa.name,
          apartmentCount: hoa._count.apartments,
          apartmentsDataDate: hoa.apartmentsDataDate,
          chargesDataDate: hoa.chargesDataDate,
          notificationsDataDate: hoa.notificationsDataDate,
          createdAt: hoa.createdAt,
          updatedAt: hoa.updatedAt,
        })
      ),
    });
  } catch (error) {
    logger.error({ error }, 'HOA fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać wspólnot',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól' },
        { status: 400 }
      );
    }

    const updatedHOA = await updateHoaName(id, name);

    return NextResponse.json({
      homeownersAssociation: updatedHOA,
    });
  } catch (error) {
    logger.error({ error }, 'HOA update error');
    return NextResponse.json(
      {
        error: 'Nie udało się zaktualizować wspólnoty',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { updateApartmentStatus } from '@/lib/mutations/apartments/update-apartment-status';
import { findApartmentDetail } from '@/lib/queries/apartments/find-apartment-detail';
import {
  toApartmentDetailDto,
  toApartmentSummaryDto,
} from '@/lib/types/dto/apartment-dto';
import { toChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import { toPaymentPdfDto } from '@/lib/types/dto/payment-dto';

const logger = createLogger('api:admin:apartments:detail');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apartmentId } = await params;

    const apartment = await findApartmentDetail(apartmentId);

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      toApartmentDetailDto({
        ...apartment,
        charges: apartment.charges.map(toChargePeriodItemDto),
        payments: apartment.payments.map(toPaymentPdfDto),
      })
    );
  } catch (error) {
    logger.error({ error }, 'Error fetching apartment details');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apartmentId } = await params;
    const body = await request.json();

    // Validate request body
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const apartment = await updateApartmentStatus(apartmentId, body.isActive);

    logger.info(
      { apartmentId, isActive: body.isActive, adminEmail: session.user.email },
      'Apartment status updated'
    );

    return NextResponse.json(toApartmentSummaryDto(apartment));
  } catch (error) {
    logger.error({ error }, 'Error updating apartment status');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

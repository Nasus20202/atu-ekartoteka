import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { updateApartmentStatus } from '@/lib/mutations/apartments/update-apartment-status';
import { findApartmentDetail } from '@/lib/queries/apartments/find-apartment-detail';
import {
  type ApartmentDetailDto,
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
    const { response } = await requireAdmin();
    if (response) return response;

    const { apartmentId } = await params;

    const apartment = await findApartmentDetail(apartmentId);

    if (!apartment) {
      return NextResponse.json(
        { error: 'Nie znaleziono mieszkania' },
        { status: 404 }
      );
    }

    const body: ApartmentDetailDto = toApartmentDetailDto({
      ...apartment,
      charges: apartment.charges.map(toChargePeriodItemDto),
      payments: apartment.payments.map(toPaymentPdfDto),
    });

    return NextResponse.json(body);
  } catch (error) {
    logger.error({ error }, 'Error fetching apartment details');
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const { session, response } = await requireAdmin();
    if (response) return response;

    const { apartmentId } = await params;
    const body = await request.json();

    // Validate request body
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane żądania' },
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
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 }
    );
  }
}

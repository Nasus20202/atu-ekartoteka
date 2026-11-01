import { describe, expect, it } from 'vitest';

import {
  type ApartmentDetailDtoSource,
  toApartmentDetailDto,
  toApartmentSummaryDto,
  toHomeownersAssociationNoticeDto,
} from '@/lib/types/dto/apartment-dto';
import { toDecimal } from '@/lib/utils/decimal';

describe('toApartmentSummaryDto', () => {
  it('keeps the admin apartment summary shape explicit', () => {
    expect(
      toApartmentSummaryDto({
        id: 'apt-1',
        externalOwnerId: 'W1',
        externalApartmentId: 'A1',
        owner: 'Jan Kowalski',
        email: 'user@example.com',
        address: 'Testowa',
        building: '1',
        number: '10',
        postalCode: '00-001',
        city: 'Warszawa',
        shareRatio: 0.1,
        isActive: true,
      })
    ).toEqual({
      id: 'apt-1',
      externalOwnerId: 'W1',
      externalApartmentId: 'A1',
      owner: 'Jan Kowalski',
      email: 'user@example.com',
      address: 'Testowa',
      building: '1',
      number: '10',
      postalCode: '00-001',
      city: 'Warszawa',
      shareRatio: 0.1,
      isActive: true,
    });
  });
});

function detailSourceWithoutDates(): Omit<
  ApartmentDetailDtoSource,
  'validFrom' | 'validTo'
> {
  return {
    id: 'apt-1',
    externalOwnerId: 'W1',
    externalApartmentId: 'A1',
    owner: 'Jan Kowalski',
    email: 'user@example.com',
    address: 'Testowa',
    building: '1',
    number: '10',
    postalCode: '00-001',
    city: 'Warszawa',
    shareRatio: 0.1,
    isActive: true,
    homeownersAssociation: { id: 'hoa-1', externalId: 'HOA-1', name: 'W' },
    user: null,
    charges: [],
    chargeNotifications: [],
    payments: [],
  };
}

describe('toApartmentDetailDto', () => {
  it('maps nested notifications to frontend-safe dates, keeping ISO strings', () => {
    const dto = toApartmentDetailDto({
      id: 'apt-1',
      externalOwnerId: 'W1',
      externalApartmentId: 'A1',
      owner: 'Jan Kowalski',
      email: 'user@example.com',
      address: 'Testowa',
      building: '1',
      number: '10',
      postalCode: '00-001',
      city: 'Warszawa',
      shareRatio: 0.1,
      isActive: true,
      homeownersAssociation: {
        id: 'hoa-1',
        externalId: 'HOA-1',
        name: 'Wspólnota',
      },
      user: {
        id: 'user-1',
        name: 'Jan Kowalski',
        email: 'user@example.com',
      },
      charges: [],
      chargeNotifications: [
        {
          id: 'notif-1',
          lineNo: 1,
          description: 'Test',
          quantity: toDecimal(1),
          unit: 'szt',
          unitPrice: toDecimal(10),
          totalAmount: toDecimal(10),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      payments: [],
      validFrom: null,
      validTo: null,
    });

    expect(dto.chargeNotifications[0]).toEqual({
      id: 'notif-1',
      lineNo: 1,
      description: 'Test',
      quantity: '1',
      unit: 'szt',
      unitPrice: '10',
      totalAmount: '10',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });

  it('maps the owner start date to an ISO string', () => {
    const dto = toApartmentDetailDto({
      ...detailSourceWithoutDates(),
      validFrom: new Date('2025-02-10T00:00:00.000Z'),
      validTo: null,
    });

    expect(dto.validFrom).toBe('2025-02-10T00:00:00.000Z');
  });

  it('maps a missing owner start date to null', () => {
    const dto = toApartmentDetailDto({
      ...detailSourceWithoutDates(),
      validFrom: null,
      validTo: null,
    });

    expect(dto.validFrom).toBeNull();
  });

  it('maps the owner end date to an ISO string', () => {
    const dto = toApartmentDetailDto({
      ...detailSourceWithoutDates(),
      validFrom: null,
      validTo: new Date('2025-02-09T00:00:00.000Z'),
    });

    expect(dto.validTo).toBe('2025-02-09T00:00:00.000Z');
  });

  it('maps a missing owner end date to null', () => {
    const dto = toApartmentDetailDto({
      ...detailSourceWithoutDates(),
      validFrom: null,
      validTo: null,
    });

    expect(dto.validTo).toBeNull();
  });

  it('maps the HOA notice with header and footer', () => {
    expect(
      toHomeownersAssociationNoticeDto({
        id: 'hoa-1',
        externalId: 'HOA-1',
        name: 'Wspólnota',
        header: 'Nagłówek',
        footer: null,
      })
    ).toEqual({
      id: 'hoa-1',
      externalId: 'HOA-1',
      name: 'Wspólnota',
      header: 'Nagłówek',
      footer: null,
    });
  });
});

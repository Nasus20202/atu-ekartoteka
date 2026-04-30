import { describe, expect, it } from 'vitest';

import {
  toApartmentDetailDto,
  toApartmentSummaryDto,
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
        shareNumerator: 1,
        shareDenominator: 10,
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
      shareNumerator: 1,
      shareDenominator: 10,
      isActive: true,
    });
  });
});

describe('toApartmentDetailDto', () => {
  it('maps nested notifications to frontend-safe dates', () => {
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
      shareNumerator: 1,
      shareDenominator: 10,
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
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ],
      payments: [],
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
});

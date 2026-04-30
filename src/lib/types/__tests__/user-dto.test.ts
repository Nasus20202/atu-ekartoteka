import { describe, expect, it } from 'vitest';

import { toUserDto } from '@/lib/types/dto/user-dto';

describe('toUserDto', () => {
  it('maps dates and nested apartments to frontend-safe values', () => {
    const dto = toUserDto({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Jan Kowalski',
      role: 'TENANT',
      status: 'APPROVED',
      emailVerified: true,
      mustChangePassword: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      apartments: [
        {
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
        },
      ],
    });

    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    expect(dto.apartments).toEqual([
      {
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
      },
    ]);
  });
});

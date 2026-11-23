import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findApartmentDetail: vi.fn(),
  toApartmentDetailDto: vi.fn((value: unknown) => ({ dto: value })),
}));

vi.mock('@/lib/apartments/queries/find-apartment-detail', () => ({
  findApartmentDetail: mocks.findApartmentDetail,
}));
vi.mock('@/lib/apartments/dto/apartment-dto', () => ({
  toApartmentDetailDto: mocks.toApartmentDetailDto,
}));
vi.mock('@/lib/charges/dto/charge-dto', () => ({
  toChargePeriodItemDto: (charge: { id: string }) => ({ charge: charge.id }),
}));
vi.mock('@/lib/payments/dto/payment-dto', () => ({
  toPaymentPdfDto: (payment: { id: string }) => ({ payment: payment.id }),
}));

import { loadApartmentDetail } from '@/lib/apartments/queries/load-apartment-detail';

const NOW = new Date('2025-03-10T00:00:00Z');

describe('loadApartmentDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null for an unknown apartment', async () => {
    mocks.findApartmentDetail.mockResolvedValue(null);

    await expect(loadApartmentDetail('missing', NOW)).resolves.toBeNull();
    expect(mocks.toApartmentDetailDto).not.toHaveBeenCalled();
  });

  it('maps charges and payments to DTOs for the current period', async () => {
    mocks.findApartmentDetail.mockResolvedValue({
      id: 'apt-1',
      charges: [{ id: 'c1' }],
      payments: [{ id: 'p1' }],
    });

    const result = await loadApartmentDetail('apt-1', NOW);

    expect(mocks.findApartmentDetail).toHaveBeenCalledWith('apt-1', '202503');
    expect(result).toEqual({
      dto: {
        id: 'apt-1',
        charges: [{ charge: 'c1' }],
        payments: [{ payment: 'p1' }],
      },
    });
  });
});

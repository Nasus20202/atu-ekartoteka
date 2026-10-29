import { describe, expect, it } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import { toPaymentYearEntries } from '@/app/dashboard/payments/payment-year-entries';

type Apartment = Parameters<typeof toPaymentYearEntries>[0];

describe('toPaymentYearEntries', () => {
  it('maps payments to year rows with labels', () => {
    const apartment = {
      id: 'apt-1',
      number: '10',
      address: 'Testowa',
      building: null,
      homeownersAssociation: { name: 'Wspólnota' },
      payments: [
        createMockPayment({
          id: 'pay-2025',
          year: 2025,
          dateFrom: new Date(2025, 0, 1),
          dateTo: new Date(2025, 11, 31),
        }),
      ],
    } as unknown as Apartment;

    const [entry] = toPaymentYearEntries(apartment);

    expect(entry).toMatchObject({
      apartmentId: 'apt-1',
      apartmentLabel: 'Testowa /10',
      hoaName: 'Wspólnota',
      dateFromLabel: '1.01.2025',
      dateToLabel: '31.12.2025',
    });
    expect(entry.payment.id).toBe('pay-2025');
  });

  it('returns no entries for an apartment without payments', () => {
    expect(
      toPaymentYearEntries({
        payments: [],
        homeownersAssociation: { name: 'Wspólnota' },
      } as unknown as Apartment)
    ).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import {
  getChargesHref,
  getPaymentYearHref,
} from '@/lib/utils/dashboard-links';

describe('dashboard links', () => {
  it('links to the combined charges page', () => {
    expect(getChargesHref()).toBe('/dashboard/charges');
  });

  it('links a month to the combined charges page', () => {
    expect(getChargesHref({ period: '202503' })).toBe(
      '/dashboard/charges?month=2025-03'
    );
  });

  it('links to a single apartment charges page', () => {
    expect(getChargesHref({ apartmentId: 'apt-1' })).toBe(
      '/dashboard/charges/apt-1'
    );
  });

  it('links a month to a single apartment charges page', () => {
    expect(getChargesHref({ apartmentId: 'apt-1', period: '202503' })).toBe(
      '/dashboard/charges/apt-1?month=2025-03'
    );
  });

  it('links to the apartment payment year', () => {
    expect(getPaymentYearHref('apt-1', 2025)).toBe(
      '/dashboard/payments/apt-1/2025'
    );
  });
});

import { describe, expect, it } from 'vitest';

import { formatApartmentLabel } from '@/lib/utils/apartment-label';

describe('formatApartmentLabel', () => {
  it('joins address, building and number', () => {
    expect(
      formatApartmentLabel({ address: 'Testowa', building: '12', number: '3' })
    ).toBe('Testowa 12/3');
  });

  it('leaves the building empty when missing', () => {
    expect(
      formatApartmentLabel({ address: 'Testowa', building: null, number: '3' })
    ).toBe('Testowa /3');
  });

  it('omits a missing address without leaving a leading space', () => {
    expect(
      formatApartmentLabel({ address: null, building: '12', number: '3' })
    ).toBe('12/3');
  });
});

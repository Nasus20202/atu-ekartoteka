import { describe, expect, it } from 'vitest';

import {
  addressKey,
  aptLabel,
  type UnassignedApartment,
} from '@/app/admin/users/management/ApartmentRow';

function makeApt(
  overrides: Partial<UnassignedApartment> = {}
): UnassignedApartment {
  return {
    id: 'apt-1',
    number: '10',
    building: 'A',
    owner: 'Jan Kowalski',
    email: 'jan@example.com',
    isActive: true,
    hasTwinWithTenant: false,
    ...overrides,
  };
}

describe('aptLabel', () => {
  it('includes building when set', () => {
    expect(aptLabel(makeApt({ building: 'A', number: '10' }))).toBe(
      'Bud. A, Mieszkanie 10'
    );
  });

  it('omits building prefix when building is null', () => {
    expect(aptLabel(makeApt({ building: null, number: '5' }))).toBe(
      'Mieszkanie 5'
    );
  });

  it('handles empty string building the same as null (falsy)', () => {
    expect(aptLabel(makeApt({ building: '', number: '3' }))).toBe(
      'Mieszkanie 3'
    );
  });
});

describe('addressKey', () => {
  it('produces building__number key when building is set', () => {
    expect(addressKey(makeApt({ building: 'B', number: '20' }))).toBe('B__20');
  });

  it('uses empty string for null building', () => {
    expect(addressKey(makeApt({ building: null, number: '7' }))).toBe('__7');
  });

  it('two apartments with same building+number get the same key', () => {
    const a = makeApt({ id: 'a1', building: 'C', number: '99' });
    const b = makeApt({ id: 'a2', building: 'C', number: '99' });
    expect(addressKey(a)).toBe(addressKey(b));
  });

  it('two apartments with different numbers get different keys', () => {
    const a = makeApt({ building: 'A', number: '1' });
    const b = makeApt({ building: 'A', number: '2' });
    expect(addressKey(a)).not.toBe(addressKey(b));
  });
});

import { describe, expect, it } from 'vitest';

import { computeGroups } from '@/app/admin/users/management/ApartmentGroups';
import type { UnassignedApartment } from '@/app/admin/users/management/ApartmentRow';

function makeApt(
  id: string,
  building: string | null,
  number: string,
  email: string,
  overrides: Partial<UnassignedApartment> = {}
): UnassignedApartment {
  return {
    id,
    building,
    number,
    email,
    owner: null,
    isActive: true,
    hasTwinWithTenant: false,
    ...overrides,
  };
}

describe('computeGroups', () => {
  it('returns all empty groups for empty input', () => {
    const result = computeGroups([]);
    expect(result.duplicateAddressGroups).toHaveLength(0);
    expect(result.occupiedTwins).toHaveLength(0);
    expect(result.emailGroups).toHaveLength(0);
    expect(result.singles).toHaveLength(0);
  });

  it('places single unique apartment into singles', () => {
    const apt = makeApt('1', 'A', '1', 'a@example.com');
    const result = computeGroups([apt]);
    expect(result.singles).toHaveLength(1);
    expect(result.singles[0].id).toBe('1');
    expect(result.duplicateAddressGroups).toHaveLength(0);
  });

  it('groups two apartments sharing building+number into duplicateAddressGroups', () => {
    const a = makeApt('1', 'A', '10', 'a@example.com');
    const b = makeApt('2', 'A', '10', 'b@example.com');
    const result = computeGroups([a, b]);

    expect(result.duplicateAddressGroups).toHaveLength(1);
    expect(result.duplicateAddressGroups[0]).toHaveLength(2);
    expect(result.singles).toHaveLength(0);
    expect(result.occupiedTwins).toHaveLength(0);
  });

  it('places hasTwinWithTenant apartment (not a duplicate) into occupiedTwins', () => {
    const apt = makeApt('1', 'A', '5', 'a@example.com', {
      hasTwinWithTenant: true,
    });
    const result = computeGroups([apt]);

    expect(result.occupiedTwins).toHaveLength(1);
    expect(result.occupiedTwins[0].id).toBe('1');
    expect(result.singles).toHaveLength(0);
  });

  it('duplicate-address takes priority over hasTwinWithTenant', () => {
    const a = makeApt('1', 'B', '3', 'a@example.com', {
      hasTwinWithTenant: true,
    });
    const b = makeApt('2', 'B', '3', 'b@example.com', {
      hasTwinWithTenant: true,
    });
    const result = computeGroups([a, b]);

    expect(result.duplicateAddressGroups).toHaveLength(1);
    expect(result.occupiedTwins).toHaveLength(0);
  });

  it('groups 3+ apartments sharing email into emailGroups', () => {
    const email = 'shared@example.com';
    const apts = [
      makeApt('1', 'A', '1', email),
      makeApt('2', 'A', '2', email),
      makeApt('3', 'A', '3', email),
    ];
    const result = computeGroups(apts);

    expect(result.emailGroups).toHaveLength(1);
    expect(result.emailGroups[0]).toHaveLength(3);
    expect(result.singles).toHaveLength(0);
  });

  it('does NOT group 2 apartments sharing email (threshold is 3)', () => {
    const email = 'shared@example.com';
    const apts = [makeApt('1', 'A', '1', email), makeApt('2', 'A', '2', email)];
    const result = computeGroups(apts);

    expect(result.emailGroups).toHaveLength(0);
    expect(result.singles).toHaveLength(2);
  });

  it('occupied-twin takes priority over email grouping', () => {
    const email = 'shared@example.com';
    const twin = makeApt('1', 'A', '1', email, { hasTwinWithTenant: true });
    const other1 = makeApt('2', 'A', '2', email);
    const other2 = makeApt('3', 'A', '3', email);
    // twin is excluded from remaining before email grouping → only 2 left → no email group
    const result = computeGroups([twin, other1, other2]);

    expect(result.occupiedTwins).toHaveLength(1);
    expect(result.emailGroups).toHaveLength(0);
    expect(result.singles).toHaveLength(2);
  });

  it('handles null buildings in duplicate detection', () => {
    const a = makeApt('1', null, '5', 'a@example.com');
    const b = makeApt('2', null, '5', 'b@example.com');
    const result = computeGroups([a, b]);

    expect(result.duplicateAddressGroups).toHaveLength(1);
  });

  it('keeps all ids in correct buckets with mixed data', () => {
    const dupA = makeApt('dup1', 'A', '1', 'x@example.com');
    const dupB = makeApt('dup2', 'A', '1', 'y@example.com');
    const twin = makeApt('twin', 'B', '2', 'z@example.com', {
      hasTwinWithTenant: true,
    });
    const single = makeApt('single', 'C', '3', 'w@example.com');
    const result = computeGroups([dupA, dupB, twin, single]);

    const allIds: string[] = [
      ...result.duplicateAddressGroups.flat().map((a) => a.id),
      ...result.occupiedTwins.map((a) => a.id),
      ...result.emailGroups.flat().map((a) => a.id),
      ...result.singles.map((a) => a.id),
    ];
    expect(allIds.sort()).toEqual(['dup1', 'dup2', 'single', 'twin'].sort());
  });
});

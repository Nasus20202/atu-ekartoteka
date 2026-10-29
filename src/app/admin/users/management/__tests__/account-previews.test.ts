import { describe, expect, it } from 'vitest';

import { buildAccountPreviews } from '@/app/admin/users/management/account-previews';
import type {
  HoaGroup,
  UnassignedApartment,
} from '@/app/admin/users/management/hoa-card';

const apartment = (id: string, email: string): UnassignedApartment =>
  ({ id, email, owner: `Owner ${email}` }) as UnassignedApartment;

describe('buildAccountPreviews', () => {
  it('groups selected apartments by email across HOAs', () => {
    const hoas = [
      { apartments: [apartment('1', 'a@x.pl'), apartment('2', 'b@x.pl')] },
      { apartments: [apartment('3', 'a@x.pl'), apartment('4', 'c@x.pl')] },
    ] as HoaGroup[];

    const previews = buildAccountPreviews(hoas, new Set(['1', '2', '3']));

    expect(
      previews.map((p) => [p.email, p.owner, p.apartments.map((a) => a.id)])
    ).toEqual([
      ['a@x.pl', 'Owner a@x.pl', ['1', '3']],
      ['b@x.pl', 'Owner b@x.pl', ['2']],
    ]);
  });

  it('returns no previews without a selection', () => {
    expect(buildAccountPreviews([], new Set())).toEqual([]);
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  openAddress,
  useAddressSearchParams,
} from '@/__tests__/helpers/navigation/address';
import { useSettlementView } from '@/components/settlements/use-settlement-view';

const PATH = '/dashboard/settlements/a1';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settlements/a1',
  useSearchParams: () => useAddressSearchParams(),
}));

const open = (query = '') => {
  const replace = openAddress(`${PATH}${query}`);
  return { replace, ...renderHook(() => useSettlementView()) };
};

describe('useSettlementView', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['', 'media'],
    ['?view=meters', 'meters'],
    ['?view=annual', 'annual'],
    ['?view=other', 'media'],
  ])('reads the view of the address %j', (query, view) => {
    expect(open(query).result.current.view).toBe(view);
  });

  it('puts the chosen view into the address, keeping the rest', () => {
    const { result, replace } = open('?period=u1');

    act(() => result.current.setView('meters'));

    expect(replace).toHaveBeenCalledWith(
      null,
      '',
      `${PATH}?period=u1&view=meters`
    );
    expect(result.current.view).toBe('meters');
  });

  it.each([
    ['?view=annual&period=u1', `${PATH}?period=u1`],
    ['?view=annual', PATH],
  ])('names no view for the first one, from %j', (query, address) => {
    const { result, replace } = open(query);

    act(() => result.current.setView('media'));

    expect(replace).toHaveBeenCalledWith(null, '', address);
    expect(result.current.view).toBe('media');
  });
});

import { describe, expect, it } from 'vitest';

import { setApartmentSelection } from '@/components/users/apartment-selection';

describe('setApartmentSelection', () => {
  it('adds an apartment that is not selected yet', () => {
    expect(setApartmentSelection(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  it('keeps the list unchanged when an apartment is checked again', () => {
    expect(setApartmentSelection(['a', 'b'], 'b', true)).toEqual(['a', 'b']);
  });

  it('removes an apartment when it is unchecked', () => {
    expect(setApartmentSelection(['a', 'b'], 'a', false)).toEqual(['b']);
  });

  it('leaves the list unchanged when an unselected apartment is unchecked', () => {
    expect(setApartmentSelection(['a'], 'b', false)).toEqual(['a']);
  });
});

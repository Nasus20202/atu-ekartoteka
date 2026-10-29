import { describe, expect, it } from 'vitest';

import {
  APARTMENT_FORMS,
  formatCountPl,
  HOA_ACCUSATIVE_FORMS,
  pluralizePl,
} from '@/lib/utils/pluralize';

describe('pluralizePl', () => {
  it.each([
    [0, 'mieszkań'],
    [1, 'mieszkanie'],
    [2, 'mieszkania'],
    [4, 'mieszkania'],
    [5, 'mieszkań'],
    [11, 'mieszkań'],
    [12, 'mieszkań'],
    [14, 'mieszkań'],
    [21, 'mieszkań'],
    [22, 'mieszkania'],
    [24, 'mieszkania'],
    [25, 'mieszkań'],
    [112, 'mieszkań'],
    [122, 'mieszkania'],
  ])('uses the right form for %i', (count, expected) => {
    expect(pluralizePl(count, APARTMENT_FORMS)).toBe(expected);
  });

  it('supports other nouns', () => {
    expect(pluralizePl(0, HOA_ACCUSATIVE_FORMS)).toBe('wspólnot');
    expect(pluralizePl(3, HOA_ACCUSATIVE_FORMS)).toBe('wspólnoty');
  });
});

describe('formatCountPl', () => {
  it('prefixes the form with the count', () => {
    expect(formatCountPl(23, APARTMENT_FORMS)).toBe('23 mieszkania');
  });
});

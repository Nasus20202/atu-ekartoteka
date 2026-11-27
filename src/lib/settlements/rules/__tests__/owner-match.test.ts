import { describe, expect, it } from 'vitest';

import {
  differsByAnnotation,
  matchOwner,
} from '@/lib/settlements/rules/owner-match';

const records = (...owners: Array<string | null>) =>
  owners.map((owner, index) => ({ id: String(index), owner }));

describe('differsByAnnotation', () => {
  it.each([
    ['Kowalska Anna #5', 'Kowalska Anna #5 D'],
    ['Kowalska Anna', 'Kowalska Anna D'],
    ['Kowalska Anna @1', 'Kowalska Anna'],
    ['Kowalska Anna P12', 'Kowalska Anna 12B'],
    ['Kowalska Anna 5, 6', 'Kowalska Anna -'],
  ])('accepts %s and %s', (a, b) => {
    expect(differsByAnnotation(a, b)).toBe(true);
  });

  it.each([
    ['Kowalska Anna', 'Kowalska Maria'],
    ['Kowalska Anna', 'Kowalska Anna i Jan'],
    ['Kowalska Anna', 'Nowak Anna'],
    ['Kowalska Anna', 'Kowalska Anna'],
    ['A', 'B'],
  ])('rejects %s and %s', (a, b) => {
    expect(differsByAnnotation(a, b)).toBe(false);
  });
});

describe('matchOwner', () => {
  it('ignores letter case and repeated spaces', () => {
    expect(
      matchOwner('KOWALSKA  Anna', records('Nowak Jan', 'Kowalska Anna'))
    ).toMatchObject({ status: 'exact', apartment: { id: '1' } });
  });

  it('picks the former owner, never the current one', () => {
    expect(
      matchOwner('Nowak Jan', records('Kowalska Anna', 'Nowak Jan'))
    ).toMatchObject({ apartment: { id: '1' } });
  });

  it('prefers the exact name over an annotated one', () => {
    expect(
      matchOwner('Nowak Jan', records('Nowak Jan D', 'Nowak Jan'))
    ).toMatchObject({ status: 'exact', apartment: { id: '1' } });
  });

  it('asks for confirmation when only an annotation differs', () => {
    expect(matchOwner('Nowak Jan D', records('Nowak Jan #5'))).toMatchObject({
      status: 'annotation',
      apartment: { id: '0' },
    });
  });

  it.each([
    ['no candidate', records()],
    ['another owner', records('Kowalska Anna')],
    ['a record without an owner', records(null)],
  ])('finds nothing with %s', (_, candidates) => {
    expect(matchOwner('Nowak Jan', candidates)).toEqual({ status: 'none' });
  });

  it.each([
    ['two equal names', records('Nowak Jan', 'Nowak  jan')],
    ['two annotated names', records('Nowak Jan A', 'Nowak Jan B')],
  ])('refuses to choose between %s', (_, candidates) => {
    expect(matchOwner('Nowak Jan', candidates)).toEqual({
      status: 'ambiguous',
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  groupByCode,
  utilityUnit,
} from '@/lib/settlements/rules/group-by-code';

const CODES = ['CW', 'ZW', 'CO'];

describe('groupByCode', () => {
  it.each([
    ['Zaliczka CW', 'CW'],
    ['Wyrównanie zaliczek CW', 'CW'],
    ['Zaliczka  CO (m3)', 'CO'],
    ['Wyrównanie zaliczki CO ( GJ )', 'CO'],
    ['ZW', 'ZW'],
    ['CO 01', 'CO'],
    // The first occurrence is part of another word, the second stands alone
    ['ZCW CW', 'CW'],
    ['Zaliczka CW/2', 'CW'],
  ])('groups „%s” under %s', (name, code) => {
    expect(groupByCode(name, CODES)).toBe(code);
  });

  it.each([
    'Opłata abonamentowa',
    'Zaliczka COW',
    'Zaliczka EKOCO',
    'Zaliczka CW i ZW',
    'Zaliczka cw',
  ])('leaves „%s” without a group', (name) => {
    expect(groupByCode(name, CODES)).toBeNull();
  });

  it('counts a code listed twice once', () => {
    expect(groupByCode('Zaliczka CW', ['CW', 'CW'])).toBe('CW');
  });

  it('finds no group for an empty code', () => {
    expect(groupByCode('Zaliczka CW', [''])).toBeNull();
  });

  it('takes a code with special characters literally', () => {
    expect(groupByCode('Zaliczka C.O.', ['C.O.'])).toBe('C.O.');
    expect(groupByCode('Zaliczka CxO', ['C.O'])).toBeNull();
  });
});

describe('utilityUnit', () => {
  const reading = { device: 'CO 01', unit: 'GJ' };

  it('takes the unit of the meter first', () => {
    expect(utilityUnit('CO', CODES, [reading], ['Zaliczka CO (m3)'])).toBe(
      'GJ'
    );
  });

  it('falls back to brackets in a line name of the same utility', () => {
    expect(
      utilityUnit('CO', CODES, [], ['Opłata (szt)', 'Zaliczka CO ( m3 )'])
    ).toBe('m3');
  });

  it('knows no unit without a meter or brackets', () => {
    expect(utilityUnit('CW', CODES, [reading], ['Zaliczka CW'])).toBeNull();
  });
});

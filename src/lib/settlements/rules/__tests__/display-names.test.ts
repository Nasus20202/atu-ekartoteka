import { describe, expect, it } from 'vitest';

import {
  annualItemName,
  utilityName,
} from '@/lib/settlements/rules/display-names';

describe('display names', () => {
  it.each([
    ['CW', 'Ciepła woda'],
    ['ZW', 'Zimna woda'],
    ['CO', 'Ogrzewanie'],
    ['EE', 'EE'],
    ['toString', 'toString'],
  ])('names the utility %s', (code, name) => {
    expect(utilityName(code)).toBe(name);
  });

  it.each([
    ['Wyrównanie zaliczek CW', 'Ciepła woda'],
    ['Wyrównanie zaliczek ZW', 'Zimna woda'],
    ['Wyrównanie zaliczki CO ( m3 )', 'Ogrzewanie, opłata zmienna'],
    ['Wyrównanie zaliczki CO ( GJ )', 'Ogrzewanie, opłata zmienna'],
    ['CO opłata stała', 'Ogrzewanie, opłata stała'],
    ['Opłata za miejsce parkingowe', 'Miejsce parkingowe'],
    ['Utrzymanie dźwigu', 'Utrzymanie dźwigu'],
  ])('names the item based on %s', (basis, name) => {
    expect(annualItemName(basis, 'ROZLICZENIE')).toBe(name);
  });

  it('keeps the printed title of an unknown item', () => {
    expect(annualItemName('Domofon', 'ROZLICZENIE DOMOFONU')).toBe(
      'ROZLICZENIE DOMOFONU'
    );
  });
});

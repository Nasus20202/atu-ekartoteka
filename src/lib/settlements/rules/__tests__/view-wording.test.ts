import { describe, expect, it } from 'vitest';

import {
  annualResultTitle,
  describeUsage,
  resultKind,
  utilityHeading,
  utilityResultTitle,
} from '@/lib/settlements/rules/view-wording';

describe('settlement wording', () => {
  it.each([
    ['-1', 'overpaid', 'Nadpłata za media', 'Suma: nadpłata za 2025 rok'],
    ['1', 'due', 'Niedopłata za media', 'Suma: niedopłata za 2025 rok'],
    ['0', 'even', 'Rozliczenie mediów', 'Suma za 2025 rok'],
  ])('words a result of %s', (amount, kind, utility, annual) => {
    expect(resultKind(amount)).toBe(kind);
    expect(utilityResultTitle(amount)).toBe(utility);
    expect(annualResultTitle(amount, '2025-12-31')).toBe(annual);
  });

  it('adds the code to a named utility only', () => {
    expect(utilityHeading('Ciepła woda', 'CW')).toBe('Ciepła woda (CW)');
    expect(utilityHeading('PR', 'PR')).toBe('PR');
  });

  it.each([
    ['14.2', '20', 71, 0, 'Wykorzystano 71 procent zaliczki'],
    ['0', '20', 0, 0, 'Wykorzystano 0 procent zaliczki'],
    ['19.999', '20', 99, 0, 'Wykorzystano 99 procent zaliczki'],
    ['20', '20', 100, 0, 'Wykorzystano 100 procent zaliczki'],
    ['27.4', '25', 91, 9, 'Zużycie przekroczyło zaliczkę o 10 procent'],
    ['20.001', '20', 100, 0, 'Zużycie przekroczyło zaliczkę o 1 procent'],
  ])('describes %s used of %s', (used, paid, width, excess, label) => {
    expect(describeUsage(used, paid)).toEqual({ used: width, excess, label });
  });

  it('has no usage without an advance or with negative consumption', () => {
    expect(describeUsage('1', '0')).toBeNull();
    expect(describeUsage('-1', '10')).toBeNull();
  });
});

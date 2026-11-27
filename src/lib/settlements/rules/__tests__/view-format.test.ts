import { describe, expect, it } from 'vitest';

import {
  formatAbsoluteAmount,
  formatAnnualPeriod,
  formatBasis,
  formatCoefficient,
  formatPrice,
  formatRange,
  formatUnit,
  formatVolume,
} from '@/lib/settlements/rules/view-format';

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('settlement view formats', () => {
  it('shows volumes with three decimals or the stored precision', () => {
    expect(formatVolume('8', 'm3')).toBe('8,000\u00a0m³');
    expect(formatVolume('0.123456')).toBe('0,123456');
    expect(plain(formatVolume('-5.8', 'GJ'))).toBe('-5,800 GJ');
    expect(formatVolume('1', null)).toBe('1,000');
    expect(formatUnit('szt')).toBe('szt');
  });

  it('keeps the printed precision of prices, bases and coefficients', () => {
    expect(formatPrice('32')).toBe('32,00 zł');
    expect(formatPrice('6.1234')).toBe('6,1234 zł');
    expect(plain(formatBasis('36000.5'))).toBe('36 000,50');
    expect(formatCoefficient('0.1')).toBe('0,1000');
  });

  it('drops the sign of a result amount', () => {
    expect(plain(formatAbsoluteAmount('-287.8'))).toBe('287,80 zł');
  });

  it('names a span once per year', () => {
    expect(formatRange('2022-05-01', '2022-09-30')).toBe('01.05 – 30.09.2022');
    expect(formatRange('2021-12-01', '2022-09-30')).toBe(
      '01.12.2021 – 30.09.2022'
    );
  });

  it('calls a whole calendar year by its number', () => {
    expect(formatAnnualPeriod('2025-01-01', '2025-12-31')).toBe('Rok 2025');
    expect(formatAnnualPeriod('2025-01-01', '2025-02-28')).toBe(
      '01.01 – 28.02.2025'
    );
  });
});

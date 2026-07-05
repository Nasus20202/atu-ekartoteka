import { describe, expect, it } from 'vitest';

import { serialiseErrorsToTxt } from '@/lib/utils/export-errors';

describe('serialiseErrorsToTxt', () => {
  it('returns an empty string for an empty list', () => {
    const result = serialiseErrorsToTxt([]);

    expect(result).toBe('');
  });

  it('produces correct format for a single HOA with errors only', () => {
    const result = serialiseErrorsToTxt([
      {
        hoaId: 'TEST01',
        errors: ['Walidacja 1', 'Walidacja 2'],
        warnings: [],
      },
    ]);

    const lines = result.split('\n');
    expect(lines[0]).toBe('=== Wspólnota: TEST01 ===');
    expect(lines[1]).toBe('BŁĄD|||Walidacja 1');
    expect(lines[2]).toBe('BŁĄD|||Walidacja 2');
    expect(lines[3]).toBe('');
    expect(lines[4]).toBe('---');
    expect(lines[5]).toBe('Łącznie: 1 wspólnota, 2 błędy, 0 ostrzeżeń');
  });

  it('produces correct format for a single HOA with warnings only', () => {
    const result = serialiseErrorsToTxt([
      {
        hoaId: 'TEST02',
        errors: [],
        warnings: [
          {
            apartmentExternalId: 'W00106',
            period: '202501',
            message: 'Naliczenie ... różnica 0.0123',
          },
        ],
      },
    ]);

    const lines = result.split('\n');
    expect(lines[1]).toBe(
      'OSTRZEŻENIE|W00106|202501|Naliczenie ... różnica 0.0123'
    );
    expect(lines[3]).toBe('---');
    expect(lines[4]).toBe('Łącznie: 1 wspólnota, 0 błędów, 1 ostrzeżenie');
  });

  it('handles mixed errors and warnings', () => {
    const result = serialiseErrorsToTxt([
      {
        hoaId: 'TEST02',
        errors: ['Saldo zamknięcia nie zgadza się'],
        warnings: [
          {
            apartmentExternalId: 'W00106',
            period: '202501',
            message: 'Naliczenie ... różnica 0.0123',
          },
        ],
      },
    ]);

    const lines = result.split('\n');
    expect(lines[0]).toBe('=== Wspólnota: TEST02 ===');
    expect(lines[1]).toBe('BŁĄD|||Saldo zamknięcia nie zgadza się');
    expect(lines[2]).toBe(
      'OSTRZEŻENIE|W00106|202501|Naliczenie ... różnica 0.0123'
    );
    expect(lines[4]).toBe('---');
    expect(lines[5]).toBe('Łącznie: 1 wspólnota, 1 błąd, 1 ostrzeżenie');
  });

  it('handles multiple HOAs', () => {
    const result = serialiseErrorsToTxt([
      {
        hoaId: 'TEST02',
        errors: ['Błąd A'],
        warnings: [
          {
            apartmentExternalId: 'W001',
            period: '202501',
            message: 'Ostrzeżenie 1',
          },
        ],
      },
      {
        hoaId: 'TEST01',
        errors: ['Błąd B', 'Błąd C'],
        warnings: [],
      },
    ]);

    const lines = result.split('\n');
    expect(lines[0]).toBe('=== Wspólnota: TEST02 ===');
    expect(lines[1]).toBe('BŁĄD|||Błąd A');
    expect(lines[2]).toBe('OSTRZEŻENIE|W001|202501|Ostrzeżenie 1');
    expect(lines[4]).toBe('=== Wspólnota: TEST01 ===');
    expect(lines[5]).toBe('BŁĄD|||Błąd B');
    expect(lines[6]).toBe('BŁĄD|||Błąd C');
    expect(lines[8]).toBe('---');
    expect(lines[9]).toBe('Łącznie: 2 wspólnoty, 3 błędy, 1 ostrzeżenie');
  });

  it('handles warnings without optional fields', () => {
    const result = serialiseErrorsToTxt([
      {
        hoaId: 'TEST01',
        errors: [],
        warnings: [
          {
            message: 'Ogólne ostrzeżenie',
          },
        ],
      },
    ]);

    const lines = result.split('\n');
    expect(lines[1]).toBe('OSTRZEŻENIE|||Ogólne ostrzeżenie');
  });
});

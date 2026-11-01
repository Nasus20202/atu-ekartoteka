import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ImportResponse, ImportResult } from '@/app/admin/import/types';
import { ValidationBanner } from '@/app/admin/import/validation-banner';

const emptyStats = { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };

function hoaResult(
  hoaId: string,
  errors: string[] = [],
  warningCount = 0
): ImportResult {
  return {
    hoaId,
    apartments: emptyStats,
    errors: errors.map((message) => ({ kind: 'balance-mismatch', message })),
    warnings: Array.from({ length: warningCount }, (_, index) => ({
      kind: 'charges-mismatch',
      apartmentExternalId: `A${index}`,
      difference: '1.00',
      message: 'ostrzeżenie',
    })),
  };
}

function responseWith(results: ImportResult[]): ImportResponse {
  return {
    success: results.every(({ errors }) => errors.length === 0),
    results,
    errors: [],
  };
}

describe('ValidationBanner', () => {
  it('shows a pass message when there are no errors or warnings', () => {
    render(<ValidationBanner response={responseWith([hoaResult('KLO11')])} />);

    expect(
      screen.getByText(
        /Walidacja zakończona pomyślnie — nie znaleziono błędów ani ostrzeżeń/
      )
    ).toBeInTheDocument();
  });

  it('shows a pass message with the warning count when there are warnings only', () => {
    render(
      <ValidationBanner
        response={responseWith([
          hoaResult('KLO11', [], 2),
          hoaResult('SER03', [], 1),
        ])}
      />
    );

    expect(
      screen.getByText(
        'Walidacja z uwagami — ostrzeżenia: 3, rozbieżności sald: 0'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/pomyślnie/)).not.toBeInTheDocument();
  });

  it('shows a warning when a closing balance does not match the next year', () => {
    const result = hoaResult('KLO11');
    result.yearBalances = [
      {
        year: 2024,
        openingBalance: '1.00',
        calculatedClosing: '2.00',
        closingMismatch: true,
        records: [],
        newRecordsOpening: '0.00',
        issueCount: 1,
        status: 'warning',
      },
    ];
    render(<ValidationBanner response={responseWith([result])} />);

    expect(screen.getByText(/rozbieżności sald: 1/)).toBeInTheDocument();
    expect(screen.queryByText(/pomyślnie/)).not.toBeInTheDocument();
  });

  it('shows a failure alert with the error count and the HOA count', () => {
    render(
      <ValidationBanner
        response={responseWith([
          hoaResult('KLO11', ['a']),
          hoaResult('SER03', ['b', 'c']),
          hoaResult('STY05'),
        ])}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Walidacja nie powiodła się'
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Błędy: 3, wspólnoty z błędami: 2'
    );
  });

  it('shows the balances as OK when the full validation was skipped and no balance mismatches', () => {
    render(
      <ValidationBanner
        response={{
          ...responseWith([hoaResult('KLO11')]),
          fullValidationSkipped: true,
        }}
      />
    );

    expect(
      screen.getByText(/Pełna walidacja pominięta — salda lat są zgodne/)
    ).toBeInTheDocument();
  });

  it('shows the balance mismatches as a warning when the full validation was skipped', () => {
    const response = responseWith([
      {
        ...hoaResult('KLO11'),
        yearBalances: [
          {
            year: 2024,
            openingBalance: '0.00',
            calculatedClosing: '10.00',
            closingMismatch: true,
            issueCount: 1,
            status: 'warning',
            records: [],
            newRecordsOpening: '0.00',
          },
        ],
      },
    ]);
    render(
      <ValidationBanner
        response={{ ...response, fullValidationSkipped: true }}
      />
    );

    expect(
      screen.getByText(
        /Pełna walidacja pominięta — salda lat z rozbieżnościami: 1/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/salda lat są zgodne/)).not.toBeInTheDocument();
  });
});

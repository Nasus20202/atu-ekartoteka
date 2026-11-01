import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ImportResponse, ImportResult } from '@/app/admin/import/types';
import { ValidationResults } from '@/app/admin/import/validation-results';

const emptyStats = { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };

const withWarning: ImportResult = {
  hoaId: 'KLO11',
  apartments: emptyStats,
  errors: [],
  warnings: [
    {
      kind: 'charges-mismatch',
      apartmentExternalId: 'A1',
      difference: '1.00',
      message: 'ostrzeżenie',
    },
  ],
  yearBalances: [
    {
      year: 2025,
      openingBalance: '10.00',
      calculatedClosing: '10.00',
      closingMismatch: false,
      records: [],
      newRecordsOpening: '0.00',
      issueCount: 1,
      status: 'warning',
    },
  ],
};

const clean: ImportResult = {
  hoaId: 'SER03',
  apartments: emptyStats,
  errors: [],
  warnings: [],
  yearBalances: [],
};

describe('ValidationResults', () => {
  it('shows the banner, then the year balance grid, then the findings', () => {
    const response: ImportResponse = {
      success: true,
      results: [withWarning],
      errors: [],
    };
    render(<ValidationResults response={response} />);

    const banner = screen.getByText(/Walidacja z uwagami/);
    const grid = screen.getByRole('heading', {
      name: 'Salda lat według wspólnot',
    });
    const download = screen.getByRole('button', { name: 'Pobierz wyniki' });

    expect(
      banner.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      grid.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows the grid and the pass banner without findings', () => {
    const response: ImportResponse = {
      success: true,
      results: [clean],
      errors: [],
    };
    render(<ValidationResults response={response} />);

    expect(
      screen.getByText(/nie znaleziono błędów ani ostrzeżeń/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pobierz wyniki' })
    ).not.toBeInTheDocument();
  });
});

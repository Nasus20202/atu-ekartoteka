import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ImportResponse, ImportResult } from '@/components/import/types';
import { ValidationResults } from '@/components/import/validation-results';

const { mockDownloadTextFile } = vi.hoisted(() => ({
  mockDownloadTextFile: vi.fn(),
}));

vi.mock('@/lib/utils/download-file', () => ({
  downloadTextFile: mockDownloadTextFile,
}));

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

  it('explains a year-to-year balance difference', async () => {
    const user = userEvent.setup();
    const yearToYear: ImportResult = {
      ...withWarning,
      warnings: [
        {
          kind: 'charges-mismatch',
          apartmentExternalId: 'A1',
          message:
            'saldo otwarcia roku 2025 różni się od salda zamknięcia 2024',
        },
      ],
    };
    const response: ImportResponse = {
      success: true,
      results: [yearToYear],
      errors: [],
    };
    render(<ValidationResults response={response} />);

    await user.click(screen.getByRole('button', { name: /Wspólnota: KLO11/i }));

    expect(
      screen.getByText(/nie zgadza się z saldem zamknięcia poprzedniego roku/i)
    ).toBeInTheDocument();
  });

  it('lists the errors of an HOA once its section is expanded', async () => {
    const user = userEvent.setup();
    const withError: ImportResult = {
      ...clean,
      hoaId: 'KLO11',
      errors: [{ kind: 'transaction', message: 'Import przerwany' }],
    };
    const response: ImportResponse = {
      success: true,
      results: [withError],
      errors: [],
    };
    render(<ValidationResults response={response} />);

    await user.click(screen.getByRole('button', { name: /Wspólnota: KLO11/i }));

    expect(screen.getByText('Błędy (1)')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Błąd transakcji (1)' })
    ).toBeInTheDocument();
    expect(screen.getByText('• Import przerwany')).toBeInTheDocument();
  });

  it('downloads the findings of every HOA with findings', async () => {
    const user = userEvent.setup();
    const response: ImportResponse = {
      success: true,
      results: [withWarning, clean],
      errors: [],
    };
    render(<ValidationResults response={response} />);

    await user.click(screen.getByRole('button', { name: 'Pobierz wyniki' }));

    expect(mockDownloadTextFile).toHaveBeenCalledTimes(1);
    const [content, fileName] = mockDownloadTextFile.mock.calls[0];
    expect(fileName).toBe('walidacja-bazy.txt');
    expect(content).toContain('=== Wspólnota: KLO11 ===');
    expect(content).not.toContain('SER03');
  });
});

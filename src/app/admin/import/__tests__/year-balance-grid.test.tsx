import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ImportResult } from '@/app/admin/import/types';
import { YearBalanceGrid } from '@/app/admin/import/year-balance-grid';

const emptyStats = { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };

function hoaResult(
  hoaId: string,
  yearBalances: ImportResult['yearBalances'],
  hoaName?: string
): ImportResult {
  return {
    hoaId,
    hoaName,
    apartments: emptyStats,
    errors: [],
    warnings: [],
    yearBalances,
  };
}

const results = [
  hoaResult('KLO11', [
    {
      year: 2024,
      openingBalance: '100.00',
      calculatedClosing: '-508.53',
      closingMismatch: true,
      records: [],
      newRecordsOpening: '0.00',
      issueCount: 1,
      status: 'warning',
    },
    {
      year: 2025,
      openingBalance: '-608.24',
      calculatedClosing: '3223.95',
      closingMismatch: false,
      records: [],
      newRecordsOpening: '0.00',
      issueCount: 0,
      status: 'ok',
    },
  ]),
  hoaResult('SER03', [
    {
      year: 2025,
      openingBalance: '15.00',
      calculatedClosing: '12.00',
      closingMismatch: false,
      records: [],
      newRecordsOpening: '0.00',
      issueCount: 0,
      status: 'ok',
    },
  ]),
];

describe('YearBalanceGrid', () => {
  it('shows one row per HOA and a closing and opening column per year', () => {
    render(<YearBalanceGrid results={results} />);

    expect(
      screen.getByRole('columnheader', { name: /2024/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /2025/ })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader', { name: 'Otwarcie' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('columnheader', { name: 'Zamknięcie' })
    ).toHaveLength(2);
    expect(
      screen.getByRole('rowheader', { name: /KLO11/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: /SER03/ })
    ).toBeInTheDocument();
  });

  it('shows an empty value for a year without payments', () => {
    render(<YearBalanceGrid results={results} />);

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('marks the closing balance that does not match the next year in red', () => {
    render(<YearBalanceGrid results={results} />);

    const closing = screen.getByText(/508,53/);
    expect(closing.closest('td')).toHaveClass('text-destructive');
    expect(within(screen.getByRole('table')).getAllByText('≠')).toHaveLength(1);
  });

  it('does not mark a closing balance that matches the next year', () => {
    render(<YearBalanceGrid results={results} />);

    expect(screen.getByText(/3\s?223,95/).closest('td')).not.toHaveClass(
      'text-destructive'
    );
  });

  it('shows the newest year first', () => {
    render(<YearBalanceGrid results={results} />);

    const years = screen
      .getAllByRole('columnheader', { name: /^20\d\d/ })
      .map((header) => header.textContent?.slice(0, 4));

    expect(years).toEqual(['2025', '2024']);
  });

  it('explains the red values in text', () => {
    render(<YearBalanceGrid results={results} />);

    expect(
      screen.getByText(/wartości to błąd albo rozbieżność/)
    ).toBeInTheDocument();
  });

  it('shows the HOA name instead of its id', () => {
    render(
      <YearBalanceGrid results={[hoaResult('KLO11', [], 'Klonowa 11')]} />
    );

    expect(
      screen.getByRole('rowheader', { name: /Klonowa 11/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('rowheader', { name: /KLO11/ })
    ).not.toBeInTheDocument();
  });

  it('marks a HOA with a red value as not OK and a HOA without one as OK', () => {
    render(<YearBalanceGrid results={results} />);

    expect(
      screen.getByRole('rowheader', { name: /KLO11.*Błąd/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: /SER03.*OK/ })
    ).toBeInTheDocument();
  });

  it('marks a year as OK only when no HOA has a red value in it', () => {
    render(<YearBalanceGrid results={results} />);

    expect(
      screen.getByRole('columnheader', { name: /2024.*Błąd/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /2025.*OK/ })
    ).toBeInTheDocument();
  });

  it('does not show a warning as an error', () => {
    render(
      <YearBalanceGrid
        results={[
          {
            ...hoaResult('SER03', [
              {
                year: 2025,
                openingBalance: '15.00',
                calculatedClosing: '12.00',
                closingMismatch: false,
                records: [],
                newRecordsOpening: '0.00',
                issueCount: 5,
                status: 'warning',
              },
            ]),
            warnings: [{ apartmentExternalId: 'A1', message: 'uwaga' }],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('rowheader', { name: /SER03.*OK/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/^12,00\s+zł$/).closest('td')).not.toHaveClass(
      'text-destructive'
    );
  });

  it('shows the closing balance before the opening balance', () => {
    render(<YearBalanceGrid results={results} />);

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

    expect(headers.indexOf('Zamknięcie')).toBeLessThan(
      headers.indexOf('Otwarcie')
    );
  });

  it('shows the cells of a year with an error in red', () => {
    render(
      <YearBalanceGrid
        results={[
          hoaResult('KLO11', [
            {
              year: 2025,
              openingBalance: '10.00',
              calculatedClosing: '20.00',
              closingMismatch: false,
              records: [],
              newRecordsOpening: '0.00',
              issueCount: 1,
              status: 'error',
            },
          ]),
        ]}
      />
    );

    expect(screen.getByText(/^20,00\s+zł$/).closest('td')).toHaveClass(
      'text-destructive'
    );
    expect(screen.getByText(/^10,00\s+zł$/).closest('td')).toHaveClass(
      'text-destructive'
    );
  });
});

describe('YearBalanceGrid details', () => {
  const withRecords = [
    {
      ...hoaResult('SER03', [
        {
          year: 2025,
          openingBalance: '15789.69',
          calculatedClosing: '18054.08',
          closingMismatch: true,
          issueCount: 1,
          status: 'warning',
          newRecordsOpening: '1182.77',
          records: [
            {
              apartmentLabel: 'A-OK',
              ownerId: 'W-OK',
              opening: '0.00',
              closing: '5.00',
              nextOpening: '5.00',
              difference: '0.00',
              status: 'match',
              isNew: false,
            },
            {
              apartmentLabel: 'A-BAD',
              ownerId: 'W-BAD',
              opening: '100.00',
              closing: '200.00',
              nextOpening: '50.00',
              difference: '150.00',
              status: 'mismatch',
              isNew: false,
            },
            {
              apartmentLabel: 'A-NEW',
              ownerId: 'W-NEW',
              opening: '0.00',
              closing: '1182.77',
              nextOpening: '1182.77',
              difference: '0.00',
              status: 'match',
              isNew: true,
            },
          ],
        },
      ]),
      hoaName: 'Sympatyczna 17',
    },
  ];

  it('shows the records of a year on click, mismatches first', () => {
    render(<YearBalanceGrid results={withRecords} />);

    fireEvent.click(
      screen.getByText(/18\s?054,08/).closest('button') as HTMLElement
    );

    const dialog = screen.getByRole('dialog');
    const rows = within(dialog).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('A-BAD');
    expect(rows[2]).toHaveTextContent('A-OK');
  });

  it('closes the records on Escape', () => {
    render(<YearBalanceGrid results={withRecords} />);

    fireEvent.click(
      screen.getByText(/18\s?054,08/).closest('button') as HTMLElement
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the HOA name column in place while the table scrolls sideways', () => {
    render(<YearBalanceGrid results={withRecords} />);

    expect(
      screen.getByRole('rowheader', { name: /Sympatyczna 17/ })
    ).toHaveClass('sticky', 'left-0');
  });

  it('highlights the new owner record in yellow and the mismatch in red', () => {
    render(<YearBalanceGrid results={withRecords} />);

    fireEvent.click(
      screen.getByText(/18\s?054,08/).closest('button') as HTMLElement
    );

    const rows = within(screen.getByRole('dialog')).getAllByRole('row');
    expect(rows[1]).toHaveClass('bg-red-100');
    expect(rows[3]).toHaveTextContent('A-NEW');
    expect(rows[3]).toHaveClass('bg-yellow-100');
    expect(rows[2]).not.toHaveClass('bg-yellow-100');
  });

  it('shows the new owner balance in the opening cell', () => {
    render(<YearBalanceGrid results={withRecords} />);

    expect(screen.getByText(/w tym nowy właściciel/)).toHaveTextContent(
      '1182,77'
    );
  });
});

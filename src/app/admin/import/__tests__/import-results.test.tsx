import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImportResults } from '@/app/admin/import/import-results';
import type { ImportResponse } from '@/app/admin/import/types';

const response: ImportResponse = {
  success: true,
  errors: [{ file: 'plik.txt', error: 'Błąd pliku' }],
  results: [
    {
      hoaId: 'HOA-1',
      apartments: {
        created: 1,
        updated: 2,
        skipped: 0,
        deleted: 3,
        total: 6,
      },
      charges: {
        created: 4,
        updated: 5,
        skipped: 6,
        deleted: 0,
        total: 15,
      },
      notifications: {
        created: 7,
        updated: 8,
        skipped: 0,
        deleted: 9,
        total: 24,
      },
      payments: {
        created: 10,
        updated: 11,
        skipped: 12,
        deleted: 0,
        total: 33,
      },
      apartmentsDataDate: '2024-01-02T00:00:00.000Z',
      chargesDataDate: '2024-01-03T00:00:00.000Z',
      notificationsDataDate: '2024-01-04T00:00:00.000Z',
      errors: ['Walidacja 1', 'Walidacja 2'],
      warnings: [
        {
          apartmentExternalId: 'APT-1',
          period: '202401',
          lineNo: 4,
          difference: '0.01',
          message: 'Różnica w sumie',
        },
      ],
    },
  ],
};

describe('ImportResults', () => {
  it('renders nothing without response', () => {
    const { container } = render(<ImportResults response={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders success, file errors, failed HOA summary and result details', () => {
    render(<ImportResults response={response} />);

    expect(
      screen.getByText(/import zakończony pomyślnie/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/błędy plików \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/wspólnoty z błędami \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/wspólnota: HOA-1/i)).toBeInTheDocument();
    expect(screen.getByText(/mieszkania: 2.01.2024/i)).toBeInTheDocument();
    expect(screen.getByText(/naliczenia: 3.01.2024/i)).toBeInTheDocument();
    expect(screen.getByText(/powiadomienia o opłatach/i)).toBeInTheDocument();
    expect(screen.getByText(/wpłaty/i)).toBeInTheDocument();
    expect(screen.getByText(/błędy walidacji \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ostrzeżenia \(1\)/i)).toBeInTheDocument();
  });
});

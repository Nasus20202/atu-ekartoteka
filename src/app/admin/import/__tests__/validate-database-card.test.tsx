import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportResponse } from '@/app/admin/import/types';
import { ValidateDatabaseCard } from '@/app/admin/import/validate-database-card';

const downloadTextFile = vi.fn();

vi.mock('@/lib/utils/download-file', () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
}));

const emptyStats = { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };

function respondWith(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('ValidateDatabaseCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('calls the validation endpoint on click', async () => {
    respondWith({ success: true, results: [], errors: [] });
    render(<ValidateDatabaseCard />);

    await userEvent.click(screen.getByRole('button', { name: 'Waliduj dane' }));

    expect(fetch).toHaveBeenCalledWith('/api/admin/import/validate', {
      method: 'POST',
    });
    expect(
      await screen.findByText(/nie znaleziono błędów ani ostrzeżeń/)
    ).toBeInTheDocument();
  });

  it('lists errors and warnings per HOA and exports them', async () => {
    const body: ImportResponse = {
      success: false,
      errors: [],
      results: [
        {
          hoaId: 'KLO11',
          apartments: emptyStats,
          errors: ['Saldo się nie zgadza'],
          warnings: [
            { apartmentExternalId: 'APT-1', message: 'Różnica w naliczeniach' },
          ],
        },
        { hoaId: 'CLEAN', apartments: emptyStats, errors: [], warnings: [] },
      ],
    };
    respondWith(body);
    render(<ValidateDatabaseCard />);

    await userEvent.click(screen.getByRole('button', { name: 'Waliduj dane' }));

    const trigger = await screen.findByRole('button', {
      name: /Wspólnota: KLO11/,
    });
    expect(trigger).toHaveTextContent('Błędy: 1');
    expect(trigger).toHaveTextContent('Ostrzeżenia: 1');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Saldo się nie zgadza/)).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(screen.getByText(/Saldo się nie zgadza/)).toBeInTheDocument();
    expect(screen.getByText(/Różnica w naliczeniach/)).toBeInTheDocument();
    expect(screen.queryByText(/Wspólnota: CLEAN/)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Pobierz wyniki' })
    );
    expect(downloadTextFile).toHaveBeenCalledWith(
      expect.stringContaining('KLO11'),
      'walidacja-bazy.txt'
    );
  });

  it('shows an alert when the request fails', async () => {
    respondWith({ error: 'Walidacja danych nie powiodła się' }, false);
    render(<ValidateDatabaseCard />);

    await userEvent.click(screen.getByRole('button', { name: 'Waliduj dane' }));

    expect(await screen.findByText('Błąd walidacji')).toBeInTheDocument();
    expect(
      screen.getByText('Walidacja danych nie powiodła się')
    ).toBeInTheDocument();
  });

  it('disables the button while validating', async () => {
    let resolve: (value: Response) => void = () => undefined;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((r) => {
        resolve = r;
      })
    );
    render(<ValidateDatabaseCard />);

    await userEvent.click(screen.getByRole('button', { name: 'Waliduj dane' }));

    expect(
      screen.getByRole('button', { name: 'Walidowanie...' })
    ).toBeDisabled();
    resolve({
      ok: true,
      json: async () => ({ success: true, results: [], errors: [] }),
    } as Response);
  });

  it('explains year-to-year warnings and keeps each HOA collapsible on its own', async () => {
    const body: ImportResponse = {
      success: false,
      errors: [],
      results: [
        {
          hoaId: 'KA75A',
          apartments: emptyStats,
          errors: [],
          warnings: [
            {
              apartmentExternalId: 'A1',
              message:
                'Lokal A1, rok 2026: saldo otwarcia 10 ≠ saldo zamknięcia roku 2025 z pliku 0',
            },
          ],
        },
        {
          hoaId: 'APO52',
          apartments: emptyStats,
          errors: [],
          warnings: [{ apartmentExternalId: 'A2', message: 'Zaokrąglenie' }],
        },
      ],
    };
    respondWith(body);
    render(<ValidateDatabaseCard />);

    await userEvent.click(screen.getByRole('button', { name: 'Waliduj dane' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /Wspólnota: KA75A/ })
    );

    expect(screen.getByText(/pomija wyrównania zaliczek/)).toBeInTheDocument();
    expect(screen.queryByText(/Zaokrąglenie/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Wspólnota: APO52/ })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Błąd oznacza, że import/)).toBeInTheDocument();
  });
});

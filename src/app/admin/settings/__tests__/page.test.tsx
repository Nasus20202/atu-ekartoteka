import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/app/admin/settings/page';

const FIXED_NOW = new Date(2026, 9, 30);

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

async function renderLoaded() {
  render(<SettingsPage />);
  return screen.findByLabelText(
    'Liczba poprzednich lat widocznych dla mieszkańców'
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the stored value and the visible years', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 2 }))
    );

    const input = await renderLoaded();

    expect(input).toHaveValue(2);
    expect(
      screen.getByText('Mieszkańcy widzą lata 2024–2026')
    ).toBeInTheDocument();
  });

  it('updates the preview while typing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 2 }))
    );

    await renderLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Mniej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mniej lat' }));

    expect(
      screen.getByText('Mieszkańcy widzą tylko rok 2026')
    ).toBeInTheDocument();
  });

  it('saves a new value', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ tenantHistoryYearsBack: 2 }))
      .mockResolvedValueOnce(jsonResponse({ tenantHistoryYearsBack: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = await renderLoaded();
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByText('Zapisano ustawienia')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantHistoryYearsBack: 1 }),
    });
  });

  it('keeps saving disabled until the value changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 2 }))
    );

    await renderLoaded();
    const save = screen.getByRole('button', { name: 'Zapisz' });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    expect(save).toBeEnabled();
  });

  it('hides the success message after the next edit', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ tenantHistoryYearsBack: 2 }))
        .mockResolvedValueOnce(jsonResponse({ tenantHistoryYearsBack: 3 }))
    );

    await renderLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Zapisano ustawienia'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('rejects invalid typed values without saving', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = await renderLoaded();
    fireEvent.change(input, { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText('Podaj liczbę całkowitą od 0 do 20')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the server error when saving fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ tenantHistoryYearsBack: 2 }))
        .mockResolvedValueOnce(
          jsonResponse({ error: 'Nieprawidłowa liczba lat' }, false)
        )
    );

    await renderLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText('Nieprawidłowa liczba lat')
    ).toBeInTheDocument();
  });

  it('shows an error when settings cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));

    render(<SettingsPage />);

    expect(
      await screen.findByText('Nie udało się pobrać ustawień')
    ).toBeInTheDocument();
  });

  it('treats an empty value as invalid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = await renderLoaded();
    fireEvent.change(input, { target: { value: '  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText('Podaj liczbę całkowitą od 0 do 20')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

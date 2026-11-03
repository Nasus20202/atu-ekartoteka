import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsContent } from '@/components/settings/settings-content';

const FIXED_NOW = new Date(2026, 9, 30);
const INPUT_LABEL = 'Liczba poprzednich lat widocznych dla mieszkańców';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

function renderContent() {
  render(<SettingsContent initialYearsBack={2} />);
  return screen.getByLabelText(INPUT_LABEL);
}

describe('SettingsContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the stored value and the visible years', () => {
    const input = renderContent();

    expect(input).toHaveValue(2);
    expect(
      screen.getByText('Mieszkańcy widzą lata 2024–2026')
    ).toBeInTheDocument();
  });

  it('updates the preview while typing', () => {
    renderContent();
    fireEvent.click(screen.getByRole('button', { name: 'Mniej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mniej lat' }));

    expect(
      screen.getByText('Mieszkańcy widzą tylko rok 2026')
    ).toBeInTheDocument();
  });

  it('saves a new value', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = renderContent();
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByText('Zapisano ustawienia')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantHistoryYearsBack: 1 }),
    });
  });

  it('keeps saving disabled until the value changes', () => {
    renderContent();
    const save = screen.getByRole('button', { name: 'Zapisz' });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    expect(save).toBeEnabled();
  });

  it('hides the success message after the next edit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ tenantHistoryYearsBack: 3 }))
    );

    renderContent();
    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Zapisano ustawienia'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([
    ['21', 'a number above the limit'],
    ['  ', 'an empty value'],
  ])('rejects %j (%s) without saving', async (value) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const input = renderContent();
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText('Podaj liczbę całkowitą od 0 do 20')
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server error when saving fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: 'Nieprawidłowa liczba lat' }, false)
        )
    );

    renderContent();
    fireEvent.click(screen.getByRole('button', { name: 'Więcej lat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(
      await screen.findByText('Nieprawidłowa liczba lat')
    ).toBeInTheDocument();
  });
});

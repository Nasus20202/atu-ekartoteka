import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HoaNoticesDialog } from '@/app/admin/apartments/hoa-notices-dialog';

const NOTICES = {
  homeownersAssociations: [
    {
      id: 'hoa-1',
      externalId: 'TEST01',
      name: 'Wspólnota A',
      header: 'Nagłówek A',
      footer: 'Stopka A',
    },
    {
      id: 'hoa-2',
      externalId: 'TEST02',
      name: 'Wspólnota B',
      header: null,
      footer: 'Stopka B',
    },
    {
      id: 'hoa-3',
      externalId: 'TEST03',
      name: 'Wspólnota C',
      header: null,
      footer: null,
    },
  ],
};

function mockFetch(response: { ok: boolean; body?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.ok ? 200 : 500,
    json: async () => response.body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  render(<HoaNoticesDialog open={open} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

describe('HoaNoticesDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the header and footer of every HOA', async () => {
    const fetchMock = mockFetch({ ok: true, body: NOTICES });

    renderDialog();

    expect(await screen.findByText('Nagłówek A')).toBeVisible();
    expect(screen.getByText('Stopka A')).toBeVisible();
    expect(screen.getByText('Stopka B')).toBeVisible();
    expect(screen.getByText('Wspólnota B')).toBeVisible();
    expect(screen.getByText('Wspólnota C')).toBeVisible();
    expect(screen.getAllByText('Brak nagłówka i stopki')).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/hoa/notices');
  });

  it('does not load the notices while closed', () => {
    const fetchMock = mockFetch({ ok: true, body: NOTICES });

    renderDialog(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error when the notices cannot be loaded', async () => {
    mockFetch({ ok: false, body: { error: 'Błąd' } });

    renderDialog();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie udało się pobrać nagłówków i stopek.'
    );
  });

  it('closes through the close button', async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, body: NOTICES });
    const { onOpenChange } = renderDialog();

    await screen.findByText('Nagłówek A');
    await user.click(screen.getByRole('button', { name: 'Zamknij' }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HoaListContent } from '@/components/apartments/hoa-list-content';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';

const actionMock = vi.hoisted(() => ({ renameHoaAction: vi.fn() }));

vi.mock('@/actions/hoa', () => actionMock);

const hoa: HoaListItemDto = {
  id: 'hoa-1',
  externalId: 'W001',
  name: 'Wspólnota Testowa',
  apartmentCount: 3,
  apartmentsDataDate: null,
  chargesDataDate: null,
  notificationsDataDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('HoaListContent', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the server-provided list without fetching', () => {
    render(<HoaListContent initialHoas={[hoa]} />);

    expect(screen.getByText('Wspólnota Testowa')).toBeInTheDocument();
    expect(screen.getByText(/Znaleziono 1/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the empty state for an empty list', () => {
    render(<HoaListContent initialHoas={[]} />);

    expect(
      screen.getByText('Nie znaleziono wspólnot mieszkaniowych')
    ).toBeInTheDocument();
  });

  it('searches through the API and shows a skeleton while loading', async () => {
    let resolve: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={[hoa]} />);

    await user.type(screen.getByPlaceholderText('Wyszukaj...'), 'W9');

    expect(await screen.findByTestId('hoa-grid-skeleton')).toBeInTheDocument();
    resolve({
      ok: true,
      json: () => Promise.resolve({ homeownersAssociations: [] }),
    });
    await waitFor(() =>
      expect(screen.queryByTestId('hoa-grid-skeleton')).not.toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/hoa?search=W9');
  });

  it('renames a HOA through the action and reloads the list', async () => {
    actionMock.renameHoaAction.mockResolvedValue({
      ok: true,
      data: { id: 'hoa-1', name: 'Nowa nazwa' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          homeownersAssociations: [{ ...hoa, name: 'Nowa nazwa' }],
        }),
    });
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={[hoa]} />);

    await user.click(
      screen.getByRole('button', { name: /zmień nazwę wspólnoty/i })
    );
    const input = screen.getByDisplayValue('Wspólnota Testowa');
    await user.clear(input);
    await user.type(input, 'Nowa nazwa');
    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    expect(actionMock.renameHoaAction).toHaveBeenCalledWith(
      'hoa-1',
      'Nowa nazwa'
    );
    expect(await screen.findByText('Nowa nazwa')).toBeInTheDocument();
  });

  it('keeps editing when the rename is rejected', async () => {
    actionMock.renameHoaAction.mockResolvedValue({
      ok: false,
      error: 'Brak uprawnień',
      code: 'forbidden',
    });
    const user = userEvent.setup();
    render(<HoaListContent initialHoas={[hoa]} />);

    await user.click(
      screen.getByRole('button', { name: /zmień nazwę wspólnoty/i })
    );
    await user.click(screen.getByRole('button', { name: /zapisz/i }));

    expect(screen.getByDisplayValue('Wspólnota Testowa')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not request the list again when effects run twice', () => {
    render(
      <StrictMode>
        <HoaListContent initialHoas={[hoa]} />
      </StrictMode>
    );

    expect(screen.getByText('Wspólnota Testowa')).toBeInTheDocument();
    expect(screen.queryByTestId('hoa-grid-skeleton')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

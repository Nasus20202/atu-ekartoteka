import { act, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApartmentOptionsList } from '@/components/users/apartment-options-list';
import { ApartmentOptionsLoading } from '@/components/users/apartment-options-loading';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const user = { id: 'user-1', name: 'Jan Kowalski' } as unknown as UserDto;

const apartment = {
  id: 'apt-1',
  address: 'Lipowa',
  building: '10',
  number: '2',
  owner: 'Anna Nowak',
  email: 'anna@example.com',
  shareRatio: 0.25,
  isActive: true,
  userId: null,
} as unknown as ApartmentSummaryDto;

function json(ok: boolean, body: object) {
  return { ok, json: () => Promise.resolve(body) };
}

function renderList(search = '') {
  return render(
    <Suspense fallback={<ApartmentOptionsLoading />}>
      <ApartmentOptionsList
        apartmentSearch={search}
        onApartmentCheckedChange={() => {}}
        selectedApartments={[]}
        user={user}
      />
    </Suspense>
  );
}

describe('ApartmentOptionsList', () => {
  it('shows a spinner while the apartments load, then the list', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((r) => (resolveRequest = r)))
    );

    await act(async () => {
      renderList();
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ładowanie mieszkań...'
    );

    await act(async () =>
      resolveRequest(json(true, { apartments: [apartment] }))
    );

    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
    expect(screen.getByLabelText(/lipowa 10\/2/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('tells the admin when the apartments cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json(false, { error: 'x' }))
    );

    await act(async () => {
      renderList();
    });

    expect(
      await screen.findByText('Nie udało się załadować mieszkań')
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

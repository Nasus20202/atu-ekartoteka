import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/settlements/a1',
  useSearchParams: () => useAddressSearchParams(),
}));
vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));

import {
  openAddress,
  useAddressSearchParams,
} from '@/__tests__/helpers/navigation/address';
import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { TenantSettlementsShell } from '@/components/settlements/tenant-settlements-shell';

const APARTMENTS = [
  { value: 'a1', label: 'Lipowa 5/1' },
  { value: 'a2', label: 'Lipowa 5/2' },
];

const shell = (
  apartmentId: string,
  owner: string | null,
  apartments = APARTMENTS
) => (
  <TenantSettlementsShell
    apartmentId={apartmentId}
    apartments={apartments}
    owner={owner}
    hoaName="Wspólnota Testowa"
    data={settlementsDto()}
  />
);

describe('TenantSettlementsShell', () => {
  beforeEach(() => {
    openAddress('/dashboard/settlements/a1');
  });
  afterEach(() => vi.restoreAllMocks());

  it('names the apartment and its owner under the title', () => {
    render(shell('a1', 'Kowalska Anna'));

    expect(
      screen.getByRole('heading', { name: 'Rozliczenia' })
    ).toBeInTheDocument();
    expect(screen.getByText('Lipowa 5/1 · Kowalska Anna')).toBeInTheDocument();
  });

  it('chooses another apartment without carrying periods over', async () => {
    render(shell('a1', null));

    await userEvent.click(screen.getByRole('button', { name: 'Lokal' }));
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Lipowa 5/2' })
    );

    expect(replace).toHaveBeenCalledWith('/dashboard/settlements/a2', {
      scroll: false,
    });
  });

  it('offers no choice when there is one apartment', () => {
    render(shell('a1', null, APARTMENTS.slice(0, 1)));

    expect(
      screen.queryByRole('button', { name: 'Lokal' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Lipowa 5/1')).toBeInTheDocument();
  });

  it('keeps the view when another apartment is opened', async () => {
    render(shell('a1', null));
    await userEvent.click(screen.getByRole('tab', { name: 'Liczniki' }));

    await userEvent.click(screen.getByRole('button', { name: 'Lokal' }));
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Lipowa 5/2' })
    );

    expect(replace).toHaveBeenLastCalledWith(
      '/dashboard/settlements/a2?view=meters',
      { scroll: false }
    );
  });

  it('opens the view named by the address', () => {
    openAddress('/dashboard/settlements/a1?view=annual');

    render(shell('a1', null));

    expect(
      screen.getByRole('tab', { name: 'Koszty rzeczywiste' })
    ).toHaveAttribute('aria-selected', 'true');
  });
});

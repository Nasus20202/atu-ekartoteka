import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/settlements/use-settlement-params', () => ({
  useSettlementParams: () => ({ select: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/apartments/a1',
  useSearchParams: () => useAddressSearchParams(),
}));

import {
  openAddress,
  useAddressSearchParams,
} from '@/__tests__/helpers/navigation/address';
import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { AdminSettlementsCard } from '@/components/settlements/admin-settlements-card';

describe('AdminSettlementsCard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('offers the same views with the document details', async () => {
    openAddress('/admin/apartments/a1');
    render(
      <AdminSettlementsCard
        data={settlementsDto()}
        apartmentLabel="Lipowa 5/1"
        hoaName="Wspólnota Testowa"
      />
    );

    expect(
      screen.getByRole('region', { name: 'Rozliczenia' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Dane dokumentu')).toHaveTextContent(
      'media.pdf'
    );

    await userEvent.click(
      screen.getByRole('tab', { name: 'Koszty rzeczywiste' })
    );

    expect(screen.getByLabelText('Dane dokumentu')).toHaveTextContent(
      'roczne.pdf'
    );
    expect(window.location.search).toBe('?view=annual');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const load = vi.hoisted(() => vi.fn());

vi.mock('@/app/dashboard/settlements/load-tenant-settlements', () => ({
  loadTenantSettlements: load,
}));
vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));
vi.mock('@/components/settlements/tenant-settlements-shell', () => ({
  TenantSettlementsShell: (props: object) => (
    <pre data-testid="shell">{JSON.stringify(props)}</pre>
  ),
}));

import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { TenantSettlementsSection } from '@/components/settlements/tenant-settlements-section';

const apartment = {
  id: 'a1',
  address: 'Lipowa',
  building: '5',
  number: '1',
  owner: 'Kowalska Anna',
  homeownersAssociation: { name: 'Wspólnota Testowa' },
};

describe('TenantSettlementsSection', () => {
  it('hands the apartment of the path to the page', async () => {
    load.mockResolvedValue({
      apartments: [apartment],
      apartment,
      data: settlementsDto(),
    });

    const { container } = render(
      await TenantSettlementsSection({
        params: Promise.resolve({ apartmentId: 'a1' }),
        searchParams: Promise.resolve({ period: 'u1' }),
      })
    );

    expect(load).toHaveBeenLastCalledWith('a1', { period: 'u1' });
    expect(screen.getByTestId('shell')).toHaveTextContent(
      '"apartments":[{"value":"a1","label":"Lipowa 5/1"}]'
    );
    expect(container.firstElementChild).toHaveClass(
      'motion-safe:animate-fade-in'
    );
  });
});

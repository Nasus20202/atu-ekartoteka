import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderSuspended } from '@/__tests__/render-suspended';
import ApartmentSettlementsPage, {
  metadata,
} from '@/app/dashboard/settlements/[apartmentId]/page';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/settlements/tenant-settlements-section', () => ({
  TenantSettlementsSection: () => <Content />,
}));

function Content() {
  if (pending.value) {
    use(new Promise<never>(() => {}));
  }

  return <div>settlements-loaded</div>;
}

const page = () => (
  <ApartmentSettlementsPage
    params={Promise.resolve({ apartmentId: 'a1' })}
    searchParams={Promise.resolve({})}
  />
);

describe('ApartmentSettlementsPage', () => {
  it('has the title of the section', () => {
    expect(metadata.title).toBe('Rozliczenia');
  });

  it('shows a skeleton while the settlements load', async () => {
    pending.value = true;

    await renderSuspended(page());

    expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
  });

  it('replaces the skeleton with the settlements', () => {
    pending.value = false;

    render(page());

    expect(screen.getByText('settlements-loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('card-list-skeleton')).not.toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderSuspended } from '@/__tests__/render-suspended';
import ApartmentChargesPage, {
  metadata,
} from '@/app/dashboard/charges/[apartmentId]/page';

const pending = vi.hoisted(() => ({ header: false, content: false }));

vi.mock('@/components/charges/apartment-charges-header', () => ({
  ApartmentChargesHeader: () => {
    if (pending.header) use(new Promise<never>(() => {}));
    return <div>header-loaded</div>;
  },
}));
vi.mock('@/components/charges/apartment-charges-content', () => ({
  ApartmentChargesContent: () => {
    if (pending.content) use(new Promise<never>(() => {}));
    return <div>content-loaded</div>;
  },
}));

function renderPage() {
  return renderSuspended(
    <ApartmentChargesPage
      params={Promise.resolve({ apartmentId: 'apt-1' })}
      searchParams={Promise.resolve({})}
    />
  );
}

describe('ApartmentChargesPage', () => {
  it('streams the header and the content independently', async () => {
    pending.header = true;
    pending.content = false;

    await renderPage();

    expect(screen.queryByText('header-loaded')).not.toBeInTheDocument();
    expect(screen.getByText('content-loaded')).toBeInTheDocument();
  });

  it('shows a card skeleton while only the content loads', async () => {
    pending.header = false;
    pending.content = true;

    await renderPage();

    expect(screen.getByText('header-loaded')).toBeInTheDocument();
    expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
  });
});

describe('ApartmentChargesPage metadata', () => {
  it('uses a static title so navigation is not blocked', () => {
    expect(metadata).toEqual({ title: 'Naliczenia mieszkania' });
  });
});

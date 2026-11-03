import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ChargesPage from '@/app/dashboard/charges/page';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/navigation/back-button', () => ({
  BackButton: () => <button type="button">Wstecz</button>,
}));
vi.mock('@/components/charges/charges-overview', () => ({
  ChargesOverview: () => <Content />,
}));

function Content() {
  if (pending.value) {
    use(new Promise<never>(() => {}));
  }

  return <div>charges-loaded</div>;
}

describe('ChargesPage', () => {
  it('shows the header and a skeleton while the charges load', () => {
    pending.value = true;

    render(<ChargesPage searchParams={Promise.resolve({})} />);

    expect(
      screen.getByRole('heading', { name: 'Naliczenia' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('charges-loaded')).not.toBeInTheDocument();
  });

  it('replaces the skeleton with the charges', () => {
    pending.value = false;

    render(<ChargesPage searchParams={Promise.resolve({})} />);

    expect(screen.getByText('charges-loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('card-list-skeleton')).not.toBeInTheDocument();
  });
});

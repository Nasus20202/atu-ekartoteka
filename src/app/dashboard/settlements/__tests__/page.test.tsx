import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderSuspended } from '@/__tests__/render-suspended';
import NotFound from '@/app/dashboard/settlements/not-found';
import SettlementsPage, { metadata } from '@/app/dashboard/settlements/page';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/settlements/settlements-entry', () => ({
  SettlementsEntry: () => <Content />,
}));

function Content() {
  if (pending.value) {
    use(new Promise<never>(() => {}));
  }

  return <div>settlements-loaded</div>;
}

const page = () => <SettlementsPage />;

describe('SettlementsPage', () => {
  it('has its own title', () => {
    expect(metadata.title).toBe('Rozliczenia');
  });

  it('shows nothing of its own while the redirect is undecided', async () => {
    pending.value = true;

    const { container } = await renderSuspended(page());

    // A fallback here would be sent before the redirect and shown twice
    expect(container).toBeEmptyDOMElement();
  });

  it('shows what the entry ends with', () => {
    pending.value = false;

    render(page());

    expect(screen.getByText('settlements-loaded')).toBeInTheDocument();
  });

  it('leads back from a settlement that is not found', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('link', { name: 'Powrót do rozliczeń' })
    ).toHaveAttribute('href', '/dashboard/settlements');
  });
});

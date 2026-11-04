import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorPage from '@/app/error';
import NotFound from '@/app/not-found';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('NotFound page', () => {
  it('links back to the dashboard without nesting a button in a link', () => {
    render(<NotFound />);

    const link = screen.getByRole('link', {
      name: 'Powrót do strony głównej',
    });

    expect(link).toHaveAttribute('href', '/dashboard');
    expect(link.querySelector('button')).toBeNull();
  });

  it('shows the 404 heading', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
  });
});

describe('ErrorPage digest', () => {
  it('shows the digest so the error can be found in the logs', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('omits the error code when there is no digest', () => {
    render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kod błędu/)).toBeNull();
  });
});

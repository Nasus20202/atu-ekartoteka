import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { DashboardNavbarSkeleton } from '@/components/navigation/dashboard-navbar-skeleton';

describe('dashboard skeletons', () => {
  it('hides the page skeleton blocks from assistive technology', () => {
    const { container } = render(<DashboardSkeleton />);

    const blocks = container.querySelectorAll('[aria-hidden="true"]');

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('only pulses when motion is allowed', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'motion-safe:animate-pulse',
      'motion-reduce:animate-none'
    );
  });

  it('keeps the brand link visible in the navbar skeleton', () => {
    render(<DashboardNavbarSkeleton />);

    expect(
      screen.getByRole('link', { name: 'ATU Ekartoteka' })
    ).toHaveAttribute('href', '/dashboard');
  });
});

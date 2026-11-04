import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardNavbarSkeleton } from '@/components/navigation/dashboard-navbar-skeleton';

describe('dashboard navbar skeleton', () => {
  it('keeps the brand link visible in the navbar skeleton', () => {
    render(<DashboardNavbarSkeleton />);

    expect(
      screen.getByRole('link', { name: 'ATU Ekartoteka' })
    ).toHaveAttribute('href', '/dashboard');
  });
});

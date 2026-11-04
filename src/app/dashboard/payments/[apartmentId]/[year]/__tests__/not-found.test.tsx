import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@/app/dashboard/payments/[apartmentId]/[year]/not-found';

describe('payments not-found page', () => {
  it('explains that there are no payments for the year', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: 'Wpłaty nie znalezione' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Brak wpłat dla tego mieszkania/)).toBeVisible();
  });

  it('links back to the payments list without nesting a button', () => {
    render(<NotFound />);

    const link = screen.getByRole('link', { name: 'Powrót do wpłat' });

    expect(link).toHaveAttribute('href', '/dashboard/payments');
    expect(link.querySelector('button')).toBeNull();
  });
});

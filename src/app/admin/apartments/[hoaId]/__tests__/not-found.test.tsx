import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@/app/admin/apartments/[hoaId]/not-found';

describe('admin HOA not-found page', () => {
  it('explains that the association does not exist', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: 'Wspólnota nie znaleziona' })
    ).toBeInTheDocument();
  });

  it('links back to the admin apartments list without nesting a button', () => {
    render(<NotFound />);

    const link = screen.getByRole('link', { name: 'Powrót do wspólnot' });

    expect(link).toHaveAttribute('href', '/admin/apartments');
    expect(link.querySelector('button')).toBeNull();
  });
});

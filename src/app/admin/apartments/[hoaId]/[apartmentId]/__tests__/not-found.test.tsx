import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@/app/admin/apartments/[hoaId]/[apartmentId]/not-found';

describe('admin apartment not-found page', () => {
  it('explains that the apartment does not exist', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', { name: 'Mieszkanie nie znalezione' })
    ).toBeInTheDocument();
  });

  it('links back to the admin apartments list without nesting a button', () => {
    render(<NotFound />);

    const link = screen.getByRole('link', { name: 'Powrót do mieszkań' });

    expect(link).toHaveAttribute('href', '/admin/apartments');
    expect(link.querySelector('button')).toBeNull();
  });
});

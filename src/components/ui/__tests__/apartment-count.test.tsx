import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApartmentCount } from '@/components/ui/apartment-count';

describe('ApartmentCount', () => {
  it('renders the count with the matching Polish form', () => {
    render(<ApartmentCount count={22} />);

    expect(screen.getByText('22 mieszkania')).toBeInTheDocument();
  });
});

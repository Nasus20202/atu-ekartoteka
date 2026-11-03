import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableSkeleton } from '@/components/skeletons/table-skeleton';

describe('TableSkeleton', () => {
  it('renders a header and the requested number of rows', () => {
    render(<TableSkeleton columns={3} rows={4} />);

    const table = screen.getByTestId('table-skeleton');
    expect(table).toHaveAttribute('aria-hidden', 'true');
    expect(table.children).toHaveLength(5);
    expect(table.children[0].children).toHaveLength(3);
  });

  it('accepts its own test id', () => {
    render(<TableSkeleton data-testid="custom" />);

    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });
});

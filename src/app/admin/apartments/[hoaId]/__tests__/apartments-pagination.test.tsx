import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApartmentsPagination } from '@/app/admin/apartments/[hoaId]/apartments-pagination';

const pagination = (page: number, totalPages: number) => ({
  page,
  limit: 20,
  total: totalPages * 20,
  totalPages,
});

describe('ApartmentsPagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      <ApartmentsPagination
        pagination={pagination(1, 1)}
        onPageChange={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('disables previous on the first page and changes pages', async () => {
    const onPageChange = vi.fn();
    render(
      <ApartmentsPagination
        pagination={pagination(1, 10)}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByRole('button', { name: /Poprzednia/ })).toBeDisabled();
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /Następna/ }));
    await userEvent.click(screen.getByRole('button', { name: '10' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 10);
  });

  it('disables next and goes back from the last page', async () => {
    const onPageChange = vi.fn();
    render(
      <ApartmentsPagination
        pagination={pagination(3, 3)}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByRole('button', { name: /Następna/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Poprzednia/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

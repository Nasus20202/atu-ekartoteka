import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Table, TableHeader, TableRow } from '@/components/ui/table';
import type { SortDirection } from '@/lib/utils/sort';

function renderHead(direction: SortDirection | null) {
  const onSort = vi.fn();
  render(
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            label="Adres"
            direction={direction}
            onSort={onSort}
            className="text-right"
          />
        </TableRow>
      </TableHeader>
    </Table>
  );
  return onSort;
}

describe('SortableTableHead', () => {
  it.each([
    [null, 'none'],
    ['asc', 'ascending'],
    ['desc', 'descending'],
  ] as const)('exposes aria-sort for direction %s', (direction, ariaSort) => {
    renderHead(direction);

    expect(screen.getByRole('columnheader', { name: 'Adres' })).toHaveAttribute(
      'aria-sort',
      ariaSort
    );
  });

  it('applies the custom class to the header cell', () => {
    renderHead(null);

    expect(screen.getByRole('columnheader')).toHaveClass('text-right');
  });

  it('calls onSort when the button is clicked', async () => {
    const onSort = renderHead('desc');

    await userEvent.click(screen.getByRole('button', { name: 'Adres' }));

    expect(onSort).toHaveBeenCalledTimes(1);
  });
});

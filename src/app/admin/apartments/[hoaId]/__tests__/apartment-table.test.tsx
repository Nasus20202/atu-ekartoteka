import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createMockApartment } from '@/__tests__/fixtures';
import { buildAddressKey } from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { ApartmentTable } from '@/app/admin/apartments/[hoaId]/apartment-table';
import type { ApartmentSortKey, SortState } from '@/lib/utils/sort';

const apartment = createMockApartment({
  shareNumerator: 25,
  shareDenominator: 1000,
});

function renderTable(
  duplicateAddresses = new Set<string>(),
  sort: SortState<ApartmentSortKey> | null = null
) {
  const onSort = vi.fn();
  render(
    <ApartmentTable
      apartments={[apartment]}
      hoaId="hoa1"
      duplicateAddresses={duplicateAddresses}
      sort={sort}
      onSort={onSort}
    />
  );
  return onSort;
}

describe('ApartmentTable', () => {
  it('renders column headers and the apartment data', () => {
    renderTable();

    expect(
      screen.getByRole('columnheader', { name: 'Adres' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Właściciel' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Udział' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Status' })
    ).toBeInTheDocument();

    expect(screen.getByText('Main Street 1 A/101')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('Aktywne')).toBeInTheDocument();
    expect(screen.queryByText('Duplikat adresu')).not.toBeInTheDocument();
  });

  it('links the address to the apartment details', () => {
    renderTable();

    expect(
      screen.getByRole('link', { name: 'Main Street 1 A/101' })
    ).toHaveAttribute('href', '/admin/apartments/hoa1/apt1');
  });

  it('mutes inactive apartments and marks duplicates', () => {
    render(
      <ApartmentTable
        apartments={[{ ...apartment, isActive: false }]}
        hoaId="hoa1"
        duplicateAddresses={new Set([buildAddressKey(apartment)])}
        sort={null}
        onSort={vi.fn()}
      />
    );

    expect(screen.getByRole('row', { name: /Main Street/ })).toHaveClass(
      'opacity-60'
    );
    expect(screen.getByText('Nieaktywne')).toBeInTheDocument();
    expect(screen.queryByText('Duplikat adresu')).not.toBeInTheDocument();
  });

  it('marks active apartments with a duplicated address', () => {
    renderTable(new Set([buildAddressKey(apartment)]));

    expect(screen.getByText('Duplikat adresu')).toBeInTheDocument();
  });

  it('shows a dash when the share is unknown', () => {
    render(
      <ApartmentTable
        apartments={[
          { ...apartment, shareNumerator: null, shareDenominator: 0 },
        ]}
        hoaId="hoa1"
        duplicateAddresses={new Set()}
        sort={null}
        onSort={vi.fn()}
      />
    );

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('asks for ascending sort when a header is clicked', async () => {
    const user = userEvent.setup();
    const onSort = renderTable();

    await user.click(screen.getByRole('button', { name: 'Adres' }));

    expect(onSort).toHaveBeenCalledWith({ key: 'label', direction: 'asc' });
  });

  it('asks for descending sort when the active header is clicked again', async () => {
    const user = userEvent.setup();
    const onSort = renderTable(new Set(), {
      key: 'label',
      direction: 'asc',
    });

    expect(screen.getByRole('columnheader', { name: 'Adres' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );

    await user.click(screen.getByRole('button', { name: 'Adres' }));

    expect(onSort).toHaveBeenCalledWith({ key: 'label', direction: 'desc' });
  });
});

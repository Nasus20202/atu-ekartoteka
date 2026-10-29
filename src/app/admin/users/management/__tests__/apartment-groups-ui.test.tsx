import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DuplicateAddressGroup,
  MultiApartmentEmailGroup,
  OccupiedTwinRow,
} from '@/app/admin/users/management/apartment-groups';
import {
  ApartmentRow,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';

function makeApt(
  overrides: Partial<UnassignedApartment> = {}
): UnassignedApartment {
  return {
    id: 'apt-1',
    number: '10',
    building: 'A',
    owner: 'Jan Kowalski',
    email: 'jan@example.com',
    isActive: true,
    hasTwinWithTenant: false,
    ...overrides,
  };
}

const groupComponents = [
  ['DuplicateAddressGroup', DuplicateAddressGroup],
  ['MultiApartmentEmailGroup', MultiApartmentEmailGroup],
] as const;

describe('ApartmentRow', () => {
  it('toggles an active apartment', async () => {
    const onToggle = vi.fn();
    render(
      <ApartmentRow
        apt={makeApt({ owner: null })}
        selected={false}
        onToggle={onToggle}
        onInactiveClick={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
  });

  it('asks before selecting an inactive apartment', async () => {
    const onInactiveClick = vi.fn();
    const onToggle = vi.fn();
    render(
      <ApartmentRow
        apt={makeApt({ isActive: false })}
        selected={false}
        onToggle={onToggle}
        onInactiveClick={onInactiveClick}
      />
    );

    await userEvent.click(screen.getByText('Nieaktywny'));

    expect(onInactiveClick).toHaveBeenCalledOnce();
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('keeps a selected inactive apartment enabled', () => {
    render(
      <ApartmentRow
        apt={makeApt({ isActive: false })}
        selected
        onToggle={vi.fn()}
        onInactiveClick={vi.fn()}
      />
    );

    expect(screen.getByRole('checkbox')).toBeEnabled();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});

describe.each(groupComponents)('%s', (_, GroupComponent) => {
  const group = [
    makeApt({ id: 'a' }),
    makeApt({ id: 'b' }),
    makeApt({ id: 'c' }),
  ];

  it('selects the whole group', async () => {
    const onSelectIds = vi.fn();
    render(
      <GroupComponent
        group={group}
        selectedIds={new Set(['a'])}
        onToggleApartment={vi.fn()}
        onSelectIds={onSelectIds}
        onInactiveClick={vi.fn()}
      />
    );

    await userEvent.click(screen.getAllByRole('checkbox')[0]);

    expect(onSelectIds).toHaveBeenCalledWith(['a', 'b', 'c'], true);
  });

  it('clears a fully selected group', async () => {
    const onSelectIds = vi.fn();
    render(
      <GroupComponent
        group={group}
        selectedIds={new Set(['a', 'b', 'c'])}
        onToggleApartment={vi.fn()}
        onSelectIds={onSelectIds}
        onInactiveClick={vi.fn()}
      />
    );

    await userEvent.click(screen.getAllByRole('checkbox')[0]);

    expect(onSelectIds).toHaveBeenCalledWith(['a', 'b', 'c'], false);
  });

  it('asks about an inactive member before selecting the group', async () => {
    const onInactiveClick = vi.fn();
    const onSelectIds = vi.fn();
    const inactive = makeApt({ id: 'b', isActive: false });
    render(
      <GroupComponent
        group={[group[0], inactive, group[2]]}
        selectedIds={new Set()}
        onToggleApartment={vi.fn()}
        onSelectIds={onSelectIds}
        onInactiveClick={onInactiveClick}
      />
    );

    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    await userEvent.click(screen.getByText('Nieaktywny'));

    expect(onInactiveClick.mock.calls).toEqual([[inactive], [inactive]]);
    expect(onSelectIds).not.toHaveBeenCalled();
  });

  it('toggles a single member', async () => {
    const onToggleApartment = vi.fn();
    render(
      <GroupComponent
        group={group}
        selectedIds={new Set()}
        onToggleApartment={onToggleApartment}
        onSelectIds={vi.fn()}
        onInactiveClick={vi.fn()}
      />
    );

    await userEvent.click(screen.getAllByRole('checkbox')[2]);

    expect(onToggleApartment).toHaveBeenCalledWith('b');
  });
});

describe('OccupiedTwinRow', () => {
  it('toggles the apartment and forwards inactive clicks', async () => {
    const onToggleApartment = vi.fn();
    const onInactiveClick = vi.fn();
    const inactive = makeApt({ id: 'twin-2', isActive: false });
    const { rerender } = render(
      <OccupiedTwinRow
        apt={makeApt({ id: 'twin' })}
        selected={false}
        onToggleApartment={onToggleApartment}
        onInactiveClick={onInactiveClick}
      />
    );

    await userEvent.click(screen.getByRole('checkbox'));
    rerender(
      <OccupiedTwinRow
        apt={inactive}
        selected={false}
        onToggleApartment={onToggleApartment}
        onInactiveClick={onInactiveClick}
      />
    );
    await userEvent.click(screen.getByText('Nieaktywny'));

    expect(onToggleApartment).toHaveBeenCalledWith('twin');
    expect(onInactiveClick).toHaveBeenCalledWith(inactive);
    expect(
      screen.getByText('Mieszkanie o tym adresie zostało już przypisane')
    ).toBeInTheDocument();
  });
});

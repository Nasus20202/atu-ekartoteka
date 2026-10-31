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
import { SelectableApartmentGroup } from '@/app/admin/users/management/selectable-apartment-group';

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

  it.each([
    ['row text', () => screen.getByText('Nieaktywny')],
    ['checkbox', () => screen.getByRole('checkbox')],
  ])(
    'asks before selecting an inactive apartment via its %s',
    async (_, getTarget) => {
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

      await userEvent.click(getTarget());

      expect(onInactiveClick).toHaveBeenCalledOnce();
      expect(onToggle).not.toHaveBeenCalled();
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    }
  );

  it('deselects a selected inactive apartment without asking', async () => {
    const onInactiveClick = vi.fn();
    const onToggle = vi.fn();
    render(
      <ApartmentRow
        apt={makeApt({ isActive: false })}
        selected
        onToggle={onToggle}
        onInactiveClick={onInactiveClick}
      />
    );

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onInactiveClick).not.toHaveBeenCalled();
  });
});

describe.each(groupComponents)('%s', (_, GroupComponent) => {
  const group = [
    makeApt({ id: 'a' }),
    makeApt({ id: 'b' }),
    makeApt({ id: 'c' }),
  ];
  const inactive = makeApt({ id: 'b', isActive: false });

  async function clickGroupCheckbox(
    apartments: UnassignedApartment[],
    selected: string[] = []
  ) {
    const handlers = {
      onToggleApartment: vi.fn(),
      onSelectIds: vi.fn(),
      onInactiveClick: vi.fn(),
    };
    render(
      <GroupComponent
        group={apartments}
        selectedIds={new Set(selected)}
        {...handlers}
      />
    );
    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    return handlers;
  }

  it('selects the whole group', async () => {
    const { onSelectIds } = await clickGroupCheckbox(group, ['a']);
    expect(onSelectIds).toHaveBeenCalledWith(['a', 'b', 'c'], true);
  });

  it('clears a fully selected group', async () => {
    const { onSelectIds } = await clickGroupCheckbox(group, ['a', 'b', 'c']);
    expect(onSelectIds).toHaveBeenCalledWith(['a', 'b', 'c'], false);
  });

  it('selects only active members of a group with an inactive one', async () => {
    const { onSelectIds, onInactiveClick } = await clickGroupCheckbox([
      group[0],
      inactive,
      group[2],
    ]);
    expect(onSelectIds).toHaveBeenCalledWith(['a', 'c'], true);
    expect(onInactiveClick).not.toHaveBeenCalled();
  });

  it('asks before selecting a group with only inactive members', async () => {
    const { onInactiveClick } = await clickGroupCheckbox([inactive]);
    expect(onInactiveClick).toHaveBeenCalledWith(inactive);
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

describe('SelectableApartmentGroup', () => {
  it('forwards inactive apartment clicks with the clicked apartment', async () => {
    const onInactiveClick = vi.fn();
    const inactive = makeApt({ id: 'apt-2', isActive: false });
    render(
      <SelectableApartmentGroup
        group={[makeApt(), inactive]}
        selectedIds={new Set()}
        onToggleApartment={vi.fn()}
        onSelectIds={vi.fn()}
        onInactiveClick={onInactiveClick}
        checkboxId="group"
        tone="blue"
        header="Grupa"
      />
    );

    await userEvent.click(screen.getByText('Nieaktywny'));

    expect(onInactiveClick).toHaveBeenCalledWith(inactive);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HoaCard, type HoaGroup } from '@/app/admin/users/management/HoaCard';

vi.mock('@/app/admin/users/management/ApartmentGroups', () => ({
  computeGroups: (apartments: { id: string }[]) => ({
    duplicateAddressGroups: [],
    occupiedTwins: [],
    emailGroups: [],
    singles: apartments,
  }),
  DuplicateAddressGroup: () => null,
  MultiApartmentEmailGroup: () => null,
  OccupiedTwinRow: () => null,
}));

vi.mock('@/app/admin/users/management/ApartmentRow', () => ({
  ApartmentRow: ({
    apt,
    onInactiveClick,
  }: {
    apt: { id: string; number: string };
    onInactiveClick: () => void;
  }) => (
    <button data-testid={`apt-row-${apt.id}`} onClick={onInactiveClick}>
      {apt.number}
    </button>
  ),
  addressKey: (apt: { building: string | null; number: string }) =>
    `${apt.building ?? ''}__${apt.number}`,
  aptLabel: (apt: { building: string | null; number: string }) =>
    `Mieszkanie ${apt.number}`,
}));

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => {
  let latestOnOpenChange: ((open: boolean) => void) | undefined;

  return {
    AlertDialog: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => {
      latestOnOpenChange = onOpenChange;

      return open ? <div role="dialog">{children}</div> : null;
    },
    AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
      <p>{children}</p>
    ),
    AlertDialogCancel: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => (
      <button
        onClick={() => {
          onClick?.();
          latestOnOpenChange?.(false);
        }}
      >
        {children}
      </button>
    ),
    AlertDialogAction: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick: () => void;
    }) => <button onClick={onClick}>{children}</button>,
  };
});

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange }: { onCheckedChange?: () => void }) => (
    <input type="checkbox" onChange={onCheckedChange} />
  ),
}));

vi.mock('@/components/ui/apartment-count', () => ({
  ApartmentCount: ({ count }: { count: number }) => <span>{count}</span>,
}));

function makeHoa(apartmentIds: string[]): HoaGroup {
  return {
    hoaId: 'hoa1',
    hoaName: 'Wspólnota Testowa',
    apartments: apartmentIds.map((id) => ({
      id,
      number: id,
      building: null,
      owner: null,
      email: `${id}@test.com`,
      isActive: true,
      hasTwinWithTenant: false,
    })),
  };
}

const baseProps = {
  selectedIds: new Set<string>(),
  isHoaSelected: false,
  isHoaIndeterminate: false,
  onToggleHoa: vi.fn(),
  onToggleApartment: vi.fn(),
  onSelectIds: vi.fn(),
};

describe('HoaCard', () => {
  it('renders the HOA name', () => {
    render(<HoaCard {...baseProps} hoa={makeHoa(['apt1'])} />);
    expect(screen.getByText('Wspólnota Testowa')).toBeInTheDocument();
  });

  it('renders the apartment count', () => {
    render(<HoaCard {...baseProps} hoa={makeHoa(['apt1', 'apt2'])} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows inactive apartment dialog when onInactiveClick fires', async () => {
    render(<HoaCard {...baseProps} hoa={makeHoa(['apt1'])} />);

    // Clicking apt-row triggers setPendingInactiveApt via the mocked ApartmentRow
    await userEvent.click(screen.getByTestId('apt-row-apt1'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nieaktywne mieszkanie')).toBeInTheDocument();
  });

  it('calls onToggleApartment and closes dialog when confirm button clicked', async () => {
    const onToggleApartment = vi.fn();

    render(
      <HoaCard
        {...baseProps}
        hoa={makeHoa(['apt1'])}
        onToggleApartment={onToggleApartment}
      />
    );

    await userEvent.click(screen.getByTestId('apt-row-apt1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Tak, zaznacz'));

    expect(onToggleApartment).toHaveBeenCalledWith('apt1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not call onToggleApartment when cancel button clicked', async () => {
    const onToggleApartment = vi.fn();

    render(
      <HoaCard
        {...baseProps}
        hoa={makeHoa(['apt1'])}
        onToggleApartment={onToggleApartment}
      />
    );

    await userEvent.click(screen.getByTestId('apt-row-apt1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Anuluj'));

    expect(onToggleApartment).not.toHaveBeenCalled();
  });
});

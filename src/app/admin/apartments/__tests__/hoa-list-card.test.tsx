import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HoaListCard } from '@/app/admin/apartments/hoa-list-card';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';

const hoa: HoaListItemDto = {
  id: 'hoa-1',
  externalId: 'W001',
  name: 'Wspólnota Testowa',
  apartmentCount: 3,
  apartmentsDataDate: '2025-03-07T12:00:00.000Z',
  chargesDataDate: null,
  notificationsDataDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function renderCard(
  overrides: Partial<React.ComponentProps<typeof HoaListCard>> = {}
) {
  const props = {
    hoa,
    editing: false,
    editingName: '',
    onEditingNameChange: vi.fn(),
    onStartEdit: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<HoaListCard {...props} />);
  return props;
}

describe('HoaListCard', () => {
  it('shows the HOA, apartment count, import dates and link', async () => {
    const props = renderCard();

    expect(screen.getByText('Wspólnota Testowa')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('mieszkania')).toBeInTheDocument();
    expect(screen.getByText('Mieszkania: 07.03.2025')).toBeInTheDocument();
    expect(screen.queryByText(/Naliczenia:/)).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/admin/apartments/hoa-1'
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Zmień nazwę wspólnoty Wspólnota Testowa',
      })
    );
    expect(props.onStartEdit).toHaveBeenCalledOnce();
  });

  it('shows every import date and hides the block without any', () => {
    renderCard({
      hoa: {
        ...hoa,
        chargesDataDate: '2025-03-08T12:00:00.000Z',
        notificationsDataDate: '2025-03-09T12:00:00.000Z',
      },
    });
    expect(screen.getByText('Naliczenia: 08.03.2025')).toBeInTheDocument();
    expect(screen.getByText('Powiadomienia: 09.03.2025')).toBeInTheDocument();
  });

  it('hides import dates when none are known', () => {
    renderCard({ hoa: { ...hoa, apartmentsDataDate: null } });
    expect(screen.queryByText(/Mieszkania:/)).not.toBeInTheDocument();
  });

  it('edits the name with buttons and keys', async () => {
    const props = renderCard({ editing: true, editingName: 'Nowa' });

    const input = screen.getByDisplayValue('Nowa');
    await userEvent.type(input, 'x');
    expect(props.onEditingNameChange).toHaveBeenCalledWith('Nowax');

    await userEvent.type(input, '{Enter}');
    expect(props.onSave).toHaveBeenCalledTimes(1);
    await userEvent.type(input, '{Escape}');
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    await userEvent.type(input, 'a');
    expect(props.onSave).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(props.onSave).toHaveBeenCalledTimes(2);
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });
});

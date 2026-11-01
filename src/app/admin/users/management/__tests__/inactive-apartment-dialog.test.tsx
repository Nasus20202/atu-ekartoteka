import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { UnassignedApartment } from '@/app/admin/users/management/apartment-row';
import { InactiveApartmentDialog } from '@/app/admin/users/management/inactive-apartment-dialog';

const apartment: UnassignedApartment = {
  id: 'apt-1',
  number: '4',
  building: '52',
  owner: 'Jan Kowalski',
  email: 'jan@example.com',
  isActive: false,
  hasTwinWithTenant: false,
};

function renderDialog() {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <InactiveApartmentDialog
      apartment={apartment}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  return { onConfirm, onClose };
}

describe('InactiveApartmentDialog', () => {
  it('renders nothing without a pending apartment', () => {
    render(
      <InactiveApartmentDialog
        apartment={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not confirm after the first step', async () => {
    const { onConfirm } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Kontynuuj' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByText('Potwierdź wybór nieaktywnego mieszkania')
    ).toBeInTheDocument();
    expect(screen.getByText(/Bud\. 52, Mieszkanie 4/)).toBeInTheDocument();
  });

  it('confirms after the second step and closes', async () => {
    const { onConfirm, onClose } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Kontynuuj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tak, zaznacz' }));

    expect(onConfirm).toHaveBeenCalledWith(apartment);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes without confirming on cancel', async () => {
    const { onConfirm, onClose } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Kontynuuj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmCreateDialog } from '@/app/admin/users/management/confirm-create-dialog';

const previews = [
  {
    email: 'jan@example.com',
    owner: 'Jan Kowalski',
    apartments: [
      { id: 'a1', building: '12', number: '3', isActive: true },
      { id: 'a2', building: null, number: '4', isActive: false },
    ],
  },
  { email: 'anna@example.com', owner: null, apartments: [] },
] as never;

describe('ConfirmCreateDialog', () => {
  it('lists the accounts to create and confirms', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmCreateDialog
        previews={previews}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText(/Bud\. 12, Mieszkanie 3/)).toBeInTheDocument();
    expect(screen.getByText('(nieaktywne)')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Potwierdź i utwórz' })
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('cancels when the dialog closes', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmCreateDialog
        previews={previews}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders nothing while closed', () => {
    render(
      <ConfirmCreateDialog
        previews={null}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

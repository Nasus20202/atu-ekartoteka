import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyNewUserData } from '@/app/admin/users/constants';
import { CreateUserDialog } from '@/app/admin/users/create-user-dialog';
import { AccountStatus, UserRole } from '@/lib/types';

describe('CreateUserDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <CreateUserDialog
        actionLoading={false}
        newUserData={createEmptyNewUserData()}
        onCancel={() => {}}
        onChange={() => {}}
        onSubmit={() => {}}
        open={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls change, submit and cancel handlers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <CreateUserDialog
        actionLoading={false}
        newUserData={{
          email: '',
          password: '',
          name: '',
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
        }}
        onCancel={onCancel}
        onChange={onChange}
        onSubmit={onSubmit}
        open
      />
    );

    await user.type(screen.getByLabelText(/email/i), 'jan@example.com');
    await user.type(screen.getByLabelText(/hasło/i), 'secret');
    await user.type(screen.getByLabelText(/imię i nazwisko/i), 'Jan Kowalski');
    await user.click(screen.getByRole('button', { name: /utwórz/i }));
    await user.click(screen.getByRole('button', { name: /anuluj/i }));

    expect(onChange).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileForm } from '@/components/profile-form';
import { AuthMethod } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

global.fetch = vi.fn();

describe('ProfileForm', () => {
  const mockRouter = {
    refresh: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  it('should render form with initial name', () => {
    render(
      <ProfileForm
        initialName="Jan Kowalski"
        authMethod={AuthMethod.CREDENTIALS}
      />
    );

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    expect(nameInput).toHaveValue('Jan Kowalski');
  });

  it('should render form with empty name when null', () => {
    render(
      <ProfileForm initialName={null} authMethod={AuthMethod.CREDENTIALS} />
    );

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    expect(nameInput).toHaveValue('');
  });

  it('should update name field on change', () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(nameInput).toHaveValue('New Name');
  });

  it('should toggle current password visibility', () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const currentPasswordInput = screen.getByLabelText(/obecne hasło/i);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(toggleButtons[0]);

    expect(currentPasswordInput).toHaveAttribute('type', 'text');
  });

  it('should toggle new password visibility', () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const newPasswordField = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    expect(newPasswordField).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(toggleButtons[1]);

    expect(newPasswordField).toHaveAttribute('type', 'text');
  });

  it('should show error when new password provided without current password', async () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const newPasswordInput = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/obecne hasło jest wymagane/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const currentPasswordInput = container.querySelector(
      '#currentPassword'
    ) as HTMLInputElement;
    const newPasswordInput = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    const confirmPasswordInput = container.querySelector(
      '#confirmPassword'
    ) as HTMLInputElement;

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
    });
  });

  it('should show error when new password is too short', async () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const currentPasswordInput = container.querySelector(
      '#currentPassword'
    ) as HTMLInputElement;
    const newPasswordInput = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    const confirmPasswordInput = container.querySelector(
      '#confirmPassword'
    ) as HTMLInputElement;

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/hasło musi mieć minimum 6 znaków/i)
      ).toBeInTheDocument();
    });
  });

  it('should submit name only when no password provided', async () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });
    });
  });

  it('should submit password change with current password', async () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const currentPasswordInput = container.querySelector(
      '#currentPassword'
    ) as HTMLInputElement;
    const newPasswordInput = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    const confirmPasswordInput = container.querySelector(
      '#confirmPassword'
    ) as HTMLInputElement;

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        }),
      });
    });
  });

  it('should show success message after successful update', async () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/profil został zaktualizowany/i)
      ).toBeInTheDocument();
    });
  });

  it('should clear password fields after successful update', async () => {
    const { container } = render(
      <ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />
    );

    const currentPasswordInput = container.querySelector(
      '#currentPassword'
    ) as HTMLInputElement;
    const newPasswordInput = container.querySelector(
      '#newPassword'
    ) as HTMLInputElement;
    const confirmPasswordInput = container.querySelector(
      '#confirmPassword'
    ) as HTMLInputElement;

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(currentPasswordInput).toHaveValue('');
      expect(newPasswordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });
  });

  it('should call router.refresh after successful update', async () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('should show error message on API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid password' }),
    } as Response);

    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/zapisywanie\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call router.back when cancel button clicked', () => {
    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const cancelButton = screen.getByRole('button', { name: /anuluj/i });
    fireEvent.click(cancelButton);

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should show OAuth message for Google users', () => {
    render(
      <ProfileForm initialName="Google User" authMethod={AuthMethod.GOOGLE} />
    );

    // Should show OAuth message instead of password fields
    expect(
      screen.getByText(/użytkownik zalogowany przez/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/obecne hasło/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/nowe hasło/i)).not.toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<ProfileForm initialName="" authMethod={AuthMethod.CREDENTIALS} />);

    const nameInput = screen.getByLabelText(/imię i nazwisko/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/wystąpił błąd podczas aktualizacji profilu/i)
      ).toBeInTheDocument();
    });
  });
});

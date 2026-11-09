import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordPage from '@/app/(auth)/change-password/page';

const mockUpdate = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ update: mockUpdate }),
}));

vi.mock('@/components/layout/auth-layout', () => ({
  AuthLayout: ({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
  }) => (
    <div>
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
}));

const actionMock = vi.hoisted(() => ({ updateProfileAction: vi.fn() }));

vi.mock('@/actions/account/profile', () => actionMock);

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(null);
    actionMock.updateProfileAction.mockReset();
    actionMock.updateProfileAction.mockResolvedValue({ ok: true, data: {} });
  });

  function getNewPasswordInput(container: HTMLElement) {
    return container.querySelector('#newPassword') as HTMLInputElement;
  }

  function getConfirmPasswordInput(container: HTMLElement) {
    return container.querySelector('#confirmPassword') as HTMLInputElement;
  }

  it('should render the form', () => {
    const { container } = render(<ChangePasswordPage />);

    expect(getNewPasswordInput(container)).toBeInTheDocument();
    expect(getConfirmPasswordInput(container)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ustaw hasło/i })
    ).toBeInTheDocument();
  });

  it('should show error when password is too short', async () => {
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'short' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/co najmniej 8 znaków/i)).toBeInTheDocument();
    });
    expect(actionMock.updateProfileAction).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', async () => {
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'Password123' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'Different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
    });
    expect(actionMock.updateProfileAction).not.toHaveBeenCalled();
  });

  it('should call the action, refresh the session and navigate on success', async () => {
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(actionMock.updateProfileAction).toHaveBeenCalledWith({
        newPassword: 'NewPassword1',
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
    expect(mockUpdate).toHaveBeenCalledExactlyOnceWith({});
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('should show error message when the action fails', async () => {
    actionMock.updateProfileAction.mockResolvedValueOnce({
      ok: false,
      error: 'Wystąpił błąd serwera',
      code: 'failed',
    });

    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/wystąpił błąd serwera/i)).toBeInTheDocument();
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should not have a skip/cancel option', () => {
    render(<ChangePasswordPage />);

    expect(
      screen.queryByRole('link', { name: /pomiń/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /anuluj/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pomiń/i })
    ).not.toBeInTheDocument();
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserActions } from '@/app/admin/users/use-user-actions';
import { CREDENTIALS_REQUIRED_MESSAGE } from '@/lib/auth/credential-validation';
import { AccountStatus, UserRole } from '@/lib/types';
import type { UserDto } from '@/lib/types/dto/user-dto';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  createUserRequest: vi.fn(),
  updateUserRequest: vi.fn(),
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));

vi.mock('@/app/admin/users/user-requests', () => ({
  createUserRequest: mocks.createUserRequest,
  updateUserRequest: mocks.updateUserRequest,
}));

const apartment = { id: 'apt-1' } as NonNullable<UserDto['apartments']>[number];

function createUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'user-1',
    email: 'anna@example.com',
    name: 'Anna',
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
    emailVerified: true,
    mustChangePassword: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    apartments: [apartment],
    ...overrides,
  };
}

describe('useUserActions', () => {
  const refresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    refresh.mockResolvedValue(undefined);
    vi.stubGlobal('alert', vi.fn());
  });

  it('opens and closes the user dialog with the assigned apartments', () => {
    const { result } = renderHook(() => useUserActions(refresh));

    act(() => result.current.openUserDialog(createUser(), 'assign-apartment'));

    expect(result.current.editMode).toBe('assign-apartment');
    expect(result.current.selectedApartments).toEqual(['apt-1']);

    act(() => result.current.setApartmentSearch('abc'));
    act(() => result.current.closeDialog());

    expect(result.current.editMode).toBeNull();
    expect(result.current.selectedUser).toBeNull();
    expect(result.current.selectedApartments).toEqual([]);
    expect(result.current.apartmentSearch).toBe('');
  });

  it('selects no apartments for a user without any', () => {
    const { result } = renderHook(() => useUserActions(refresh));

    act(() =>
      result.current.openUserDialog(
        createUser({ apartments: undefined }),
        'approve'
      )
    );

    expect(result.current.selectedApartments).toEqual([]);
  });

  it('opens the create dialog with an empty form and resets it on close', () => {
    const { result } = renderHook(() => useUserActions(refresh));

    act(() => result.current.openCreateDialog());
    act(() =>
      result.current.setNewUserData({
        ...result.current.newUserData,
        email: 'x@example.com',
      })
    );

    expect(result.current.editMode).toBe('create-user');

    act(() => result.current.closeCreateDialog());

    expect(result.current.editMode).toBeNull();
    expect(result.current.newUserData.email).toBe('');
  });

  it('refreshes and closes the dialog after a successful update', async () => {
    mocks.updateUserRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openUserDialog(createUser(), 'approve'));

    await act(() =>
      result.current.handleUpdateUser('user-1', AccountStatus.APPROVED, [
        'apt-1',
      ])
    );

    expect(mocks.updateUserRequest).toHaveBeenCalledWith({
      userId: 'user-1',
      status: AccountStatus.APPROVED,
      apartmentIds: ['apt-1'],
    });
    expect(refresh).toHaveBeenCalled();
    expect(result.current.editMode).toBeNull();
    expect(result.current.actionLoading).toBe(false);
  });

  it('alerts and keeps the dialog open when an update fails', async () => {
    mocks.updateUserRequest.mockResolvedValue('Błąd aktualizacji');
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openUserDialog(createUser(), 'approve'));

    await act(() =>
      result.current.handleUpdateUser('user-1', AccountStatus.APPROVED)
    );

    expect(alert).toHaveBeenCalledWith('Błąd aktualizacji');
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.editMode).toBe('approve');
  });

  it('requires credentials to create a user', async () => {
    const { result } = renderHook(() => useUserActions(refresh));

    await act(() => result.current.handleCreateUser());

    expect(alert).toHaveBeenCalledWith(CREDENTIALS_REQUIRED_MESSAGE);
    expect(mocks.createUserRequest).not.toHaveBeenCalled();
  });

  it('creates a user, refreshes and closes the dialog', async () => {
    mocks.createUserRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openCreateDialog());
    act(() =>
      result.current.setNewUserData({
        ...result.current.newUserData,
        email: 'x@example.com',
        password: 'secret-123',
      })
    );

    await act(() => result.current.handleCreateUser());

    expect(mocks.createUserRequest).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'x@example.com' })
    );
    expect(refresh).toHaveBeenCalled();
    expect(result.current.editMode).toBeNull();
  });

  it('alerts when creating a user fails', async () => {
    mocks.createUserRequest.mockResolvedValue('Użytkownik istnieje');
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openCreateDialog());
    act(() =>
      result.current.setNewUserData({
        ...result.current.newUserData,
        email: 'x@example.com',
        password: 'secret-123',
      })
    );

    await act(() => result.current.handleCreateUser());

    expect(alert).toHaveBeenCalledWith('Użytkownik istnieje');
    expect(result.current.editMode).toBe('create-user');
  });

  it('does nothing when rejecting without a selected user', async () => {
    const { result } = renderHook(() => useUserActions(refresh));

    await act(() => result.current.handleRejectFromStatusDialog());

    expect(mocks.updateUserRequest).not.toHaveBeenCalled();
  });

  it('asks for confirmation before rejecting a user with apartments', async () => {
    mocks.confirm.mockResolvedValue(false);
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openUserDialog(createUser(), 'change-status'));

    await act(() => result.current.handleRejectFromStatusDialog());

    expect(mocks.confirm).toHaveBeenCalled();
    expect(mocks.updateUserRequest).not.toHaveBeenCalled();
  });

  it('rejects a confirmed user with apartments', async () => {
    mocks.confirm.mockResolvedValue(true);
    mocks.updateUserRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useUserActions(refresh));
    act(() => result.current.openUserDialog(createUser(), 'change-status'));

    await act(() => result.current.handleRejectFromStatusDialog());

    expect(mocks.updateUserRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        status: AccountStatus.REJECTED,
      })
    );
  });

  it('rejects a user without apartments without confirmation', async () => {
    mocks.updateUserRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useUserActions(refresh));
    act(() =>
      result.current.openUserDialog(
        createUser({ apartments: [] }),
        'change-status'
      )
    );

    await act(() => result.current.handleRejectFromStatusDialog());

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.updateUserRequest).toHaveBeenCalled();
  });
});

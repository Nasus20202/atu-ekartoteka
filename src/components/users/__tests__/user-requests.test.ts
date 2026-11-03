import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CREATE_USER_FAILED_MESSAGE,
  createUserRequest,
  UPDATE_USER_FAILED_MESSAGE,
  updateUserRequest,
} from '@/components/users/user-requests';
import { AccountStatus, UserRole } from '@/lib/types';

const actionMock = vi.hoisted(() => ({
  updateUserStatusAction: vi.fn(),
  createUserAction: vi.fn(),
}));

vi.mock('@/actions/users', () => actionMock);

const newUser = {
  email: 'a@b.pl',
  password: 'Secret123',
  name: 'Jan',
  role: UserRole.TENANT,
  status: AccountStatus.APPROVED,
};

describe('user requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the user and resolves null on success', async () => {
    actionMock.updateUserStatusAction.mockResolvedValue({ ok: true, data: {} });
    const payload = { userId: 'u1', status: AccountStatus.APPROVED };

    await expect(updateUserRequest(payload)).resolves.toBeNull();
    expect(actionMock.updateUserStatusAction).toHaveBeenCalledWith(payload);
  });

  it('creates the user and resolves null on success', async () => {
    actionMock.createUserAction.mockResolvedValue({ ok: true, data: {} });

    await expect(createUserRequest(newUser)).resolves.toBeNull();
    expect(actionMock.createUserAction).toHaveBeenCalledWith(newUser);
  });

  it('returns the action error or a fallback', async () => {
    actionMock.createUserAction.mockResolvedValueOnce({
      ok: false,
      error: 'Brak uprawnień',
      code: 'forbidden',
    });
    await expect(createUserRequest(newUser)).resolves.toBe('Brak uprawnień');

    actionMock.createUserAction.mockResolvedValueOnce({
      ok: false,
      error: '',
      code: 'failed',
    });
    await expect(createUserRequest(newUser)).resolves.toBe(
      CREATE_USER_FAILED_MESSAGE
    );
  });

  it('returns the fallback when the action throws', async () => {
    actionMock.updateUserStatusAction.mockRejectedValue(new Error('offline'));

    await expect(
      updateUserRequest({ userId: 'u1', status: AccountStatus.REJECTED })
    ).resolves.toBe(UPDATE_USER_FAILED_MESSAGE);
  });
});

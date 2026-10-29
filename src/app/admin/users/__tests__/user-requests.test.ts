import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CREATE_USER_FAILED_MESSAGE,
  createUserRequest,
  UPDATE_USER_FAILED_MESSAGE,
  updateUserRequest,
} from '@/app/admin/users/user-requests';
import { AccountStatus, UserRole } from '@/lib/types';

function mockResponse(ok: boolean, body: object = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const newUser = {
  email: 'a@b.pl',
  password: 'Secret123',
  name: 'Jan',
  role: UserRole.TENANT,
  status: AccountStatus.APPROVED,
};

describe('user requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('patches the user and resolves null on success', async () => {
    const fetchMock = mockResponse(true);
    const payload = { userId: 'u1', status: AccountStatus.APPROVED };

    await expect(updateUserRequest(payload)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('returns the API error or a fallback', async () => {
    mockResponse(false, { error: 'Brak uprawnień' });
    await expect(createUserRequest(newUser)).resolves.toBe('Brak uprawnień');

    mockResponse(false);
    await expect(createUserRequest(newUser)).resolves.toBe(
      CREATE_USER_FAILED_MESSAGE
    );
  });

  it('returns the fallback when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(
      updateUserRequest({ userId: 'u1', status: AccountStatus.REJECTED })
    ).resolves.toBe(UPDATE_USER_FAILED_MESSAGE);
  });
});

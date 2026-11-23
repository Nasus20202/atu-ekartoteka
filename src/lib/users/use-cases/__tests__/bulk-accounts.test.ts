import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BCRYPT_COST } from '@/lib/auth/rules/bcrypt-cost';
import {
  bulkAssignAccounts,
  bulkCreateAccounts,
} from '@/lib/users/use-cases/bulk-accounts';

const {
  mockLog,
  mockBcryptHash,
  mockRandomBytes,
  mockFindUnassignedByIds,
  mockFindUnassignedForAssign,
  mockFindUserByEmail,
  mockCreateUserWithApartments,
  mockAssignApartmentsToUser,
  mockSendActivationEmail,
} = vi.hoisted(() => ({
  mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  mockBcryptHash: vi.fn(),
  mockRandomBytes: vi.fn(),
  mockFindUnassignedByIds: vi.fn(),
  mockFindUnassignedForAssign: vi.fn(),
  mockFindUserByEmail: vi.fn(),
  mockCreateUserWithApartments: vi.fn(),
  mockAssignApartmentsToUser: vi.fn(),
  mockSendActivationEmail: vi.fn(),
}));

vi.mock('bcrypt', () => ({ default: { hash: mockBcryptHash } }));

vi.mock('crypto', () => ({ default: { randomBytes: mockRandomBytes } }));

vi.mock('@/lib/apartments/queries/find-unassigned-apartments-by-ids', () => ({
  findUnassignedApartmentsByIds: mockFindUnassignedByIds,
}));

vi.mock(
  '@/lib/apartments/queries/find-unassigned-apartments-for-assign',
  () => ({
    findUnassignedApartmentsForAssign: mockFindUnassignedForAssign,
  })
);

vi.mock('@/lib/apartments/mutations/assign-apartments-to-user', () => ({
  assignApartmentsToUser: mockAssignApartmentsToUser,
}));

vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mockFindUserByEmail,
}));

vi.mock('@/lib/users/mutations/create-user-with-apartments', () => ({
  createUserWithApartments: mockCreateUserWithApartments,
}));

vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({
    sendAccountActivationEmail: mockSendActivationEmail,
  }),
}));

vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mockLog,
}));

// The first twelve bytes map to the first twelve characters of the temp
// password alphabet, which leaves out I, L and O.
const RANDOM_BYTES = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const TEMP_PASSWORD = 'ABCDEFGHJKMN';

function apartment(id: string, email: string, owner: string | null = null) {
  return { id, email, owner };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockRandomBytes.mockReturnValue(RANDOM_BYTES);
  mockBcryptHash.mockResolvedValue('hashed-password');
  mockFindUserByEmail.mockResolvedValue(null);
  mockCreateUserWithApartments.mockResolvedValue(undefined);
  mockAssignApartmentsToUser.mockResolvedValue(0);
  mockSendActivationEmail.mockResolvedValue(undefined);
});

describe('bulkCreateAccounts', () => {
  it('creates an account for an unassigned apartment and e-mails the temp password', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'owner@example.com', 'Jan Kowalski'),
    ]);

    const result = await bulkCreateAccounts(['apt-1']);

    expect(result).toEqual({
      ok: true,
      data: { created: 1, skipped: 0, errors: 0 },
    });
    expect(mockFindUnassignedByIds).toHaveBeenCalledWith(['apt-1']);
    expect(mockFindUserByEmail).toHaveBeenCalledWith('owner@example.com');
    expect(mockRandomBytes).toHaveBeenCalledWith(12);
    expect(mockBcryptHash).toHaveBeenCalledWith(TEMP_PASSWORD, BCRYPT_COST);
    expect(mockCreateUserWithApartments).toHaveBeenCalledWith({
      email: 'owner@example.com',
      hashedPassword: 'hashed-password',
      owner: 'Jan Kowalski',
      apartmentIds: ['apt-1'],
    });
    // The e-mailed password must be the one that was hashed and stored
    expect(mockSendActivationEmail).toHaveBeenCalledWith(
      'owner@example.com',
      TEMP_PASSWORD,
      'Jan Kowalski'
    );
  });

  it('groups apartments that share an e-mail address into one account', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'shared@example.com', 'Jan'),
      apartment('apt-2', 'shared@example.com', 'Jan'),
    ]);

    const result = await bulkCreateAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { created: 1, skipped: 0, errors: 0 },
    });
    expect(mockFindUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockCreateUserWithApartments).toHaveBeenCalledTimes(1);
    expect(mockCreateUserWithApartments).toHaveBeenCalledWith(
      expect.objectContaining({ apartmentIds: ['apt-1', 'apt-2'] })
    );
    expect(mockSendActivationEmail).toHaveBeenCalledTimes(1);
  });

  it('groups addresses that differ only in case into one account', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'Shared@example.com', 'Jan'),
      apartment('apt-2', 'shared@example.com', 'Jan'),
    ]);

    const result = await bulkCreateAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { created: 1, skipped: 0, errors: 0 },
    });
    expect(mockCreateUserWithApartments).toHaveBeenCalledTimes(1);
    expect(mockCreateUserWithApartments).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'shared@example.com',
        apartmentIds: ['apt-1', 'apt-2'],
      })
    );
  });

  it('creates one account per distinct e-mail and passes no owner name when the apartment has none', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'a@example.com', 'Anna'),
      apartment('apt-2', 'b@example.com', null),
    ]);

    const result = await bulkCreateAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { created: 2, skipped: 0, errors: 0 },
    });
    expect(mockCreateUserWithApartments).toHaveBeenNthCalledWith(1, {
      email: 'a@example.com',
      hashedPassword: 'hashed-password',
      owner: 'Anna',
      apartmentIds: ['apt-1'],
    });
    expect(mockCreateUserWithApartments).toHaveBeenNthCalledWith(2, {
      email: 'b@example.com',
      hashedPassword: 'hashed-password',
      owner: null,
      apartmentIds: ['apt-2'],
    });
    expect(mockSendActivationEmail).toHaveBeenNthCalledWith(
      2,
      'b@example.com',
      TEMP_PASSWORD,
      undefined
    );
  });

  it('skips an e-mail that already has an account without generating a password', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'existing@example.com', 'Existing'),
    ]);
    mockFindUserByEmail.mockResolvedValueOnce({ id: 'existing-user' });

    const result = await bulkCreateAccounts(['apt-1']);

    expect(result).toEqual({
      ok: true,
      data: { created: 0, skipped: 1, errors: 0 },
    });
    expect(mockLog.info).toHaveBeenCalledWith(
      { apartmentIds: ['apt-1'] },
      'Skipping existing user'
    );
    expect(mockRandomBytes).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockCreateUserWithApartments).not.toHaveBeenCalled();
    expect(mockSendActivationEmail).not.toHaveBeenCalled();
  });

  it('counts a failed account creation as an error, sends no e-mail for it and continues with the next address', async () => {
    const createError = new Error('Unique constraint failed');
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'a@example.com', 'A'),
      apartment('apt-2', 'b@example.com', 'B'),
    ]);
    mockCreateUserWithApartments
      .mockRejectedValueOnce(createError)
      .mockResolvedValueOnce(undefined);

    const result = await bulkCreateAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { created: 1, skipped: 0, errors: 1 },
    });
    expect(mockCreateUserWithApartments).toHaveBeenCalledTimes(2);
    expect(mockLog.error).toHaveBeenCalledWith(
      { err: createError, apartmentIds: ['apt-1'] },
      'Failed to create user account'
    );
    expect(mockSendActivationEmail).toHaveBeenCalledTimes(1);
    expect(mockSendActivationEmail).toHaveBeenCalledWith(
      'b@example.com',
      TEMP_PASSWORD,
      'B'
    );
  });

  it('still reports the account as created when the activation e-mail fails, and logs the failure', async () => {
    const smtpError = new Error('smtp');
    mockFindUnassignedByIds.mockResolvedValueOnce([
      apartment('apt-1', 'owner@example.com', 'Jan'),
    ]);
    mockSendActivationEmail.mockRejectedValueOnce(smtpError);

    const result = await bulkCreateAccounts(['apt-1']);

    expect(result).toEqual({
      ok: true,
      data: { created: 1, skipped: 0, errors: 0 },
    });
    await vi.waitFor(() =>
      expect(mockLog.error).toHaveBeenCalledWith(
        { err: smtpError, apartmentIds: ['apt-1'] },
        'Failed to send activation email'
      )
    );
  });

  it('reports zero counts and writes nothing when none of the apartments is unassigned', async () => {
    mockFindUnassignedByIds.mockResolvedValueOnce([]);

    const result = await bulkCreateAccounts(['apt-1']);

    expect(result).toEqual({
      ok: true,
      data: { created: 0, skipped: 0, errors: 0 },
    });
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
    expect(mockCreateUserWithApartments).not.toHaveBeenCalled();
  });

  it('returns a failed result and logs the error when the apartments cannot be loaded', async () => {
    const error = new Error('DB down');
    mockFindUnassignedByIds.mockRejectedValueOnce(error);

    const result = await bulkCreateAccounts(['apt-1']);

    expect(result).toEqual({
      ok: false,
      code: 'failed',
      message: 'Nie udało się utworzyć kont',
    });
    expect(mockLog.error).toHaveBeenCalledWith({ error }, 'Bulk create failed');
    expect(mockCreateUserWithApartments).not.toHaveBeenCalled();
  });
});

describe('bulkAssignAccounts', () => {
  it('assigns the apartments to the existing account that owns their e-mail', async () => {
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'owner@example.com'),
      apartment('apt-2', 'owner@example.com'),
    ]);
    mockFindUserByEmail.mockResolvedValueOnce({ id: 'user-1' });
    mockAssignApartmentsToUser.mockResolvedValueOnce(2);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 2, skipped: 0, errors: 0 },
    });
    expect(mockFindUnassignedForAssign).toHaveBeenCalledWith([
      'apt-1',
      'apt-2',
    ]);
    expect(mockFindUserByEmail).toHaveBeenCalledWith('owner@example.com');
    expect(mockAssignApartmentsToUser).toHaveBeenCalledWith('user-1', [
      'apt-1',
      'apt-2',
    ]);
    expect(mockCreateUserWithApartments).not.toHaveBeenCalled();
  });

  it('assigns addresses that differ only in case to one existing account', async () => {
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'Owner@example.com'),
      apartment('apt-2', 'owner@example.com'),
    ]);
    mockFindUserByEmail.mockResolvedValueOnce({ id: 'user-1' });
    mockAssignApartmentsToUser.mockResolvedValueOnce(2);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 2, skipped: 0, errors: 0 },
    });
    expect(mockFindUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockAssignApartmentsToUser).toHaveBeenCalledWith('user-1', [
      'apt-1',
      'apt-2',
    ]);
  });

  it('counts apartments the assignment did not update as skipped', async () => {
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'owner@example.com'),
      apartment('apt-2', 'owner@example.com'),
      apartment('apt-3', 'owner@example.com'),
    ]);
    mockFindUserByEmail.mockResolvedValueOnce({ id: 'user-1' });
    mockAssignApartmentsToUser.mockResolvedValueOnce(2);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2', 'apt-3']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 2, skipped: 1, errors: 0 },
    });
  });

  it('skips apartments whose e-mail has no account and assigns nothing for them', async () => {
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'nobody@example.com'),
      apartment('apt-2', 'nobody@example.com'),
    ]);
    mockFindUserByEmail.mockResolvedValueOnce(null);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 0, skipped: 2, errors: 0 },
    });
    expect(mockLog.info).toHaveBeenCalledWith(
      { apartmentIds: ['apt-1', 'apt-2'] },
      'No existing user found, skipping'
    );
    expect(mockAssignApartmentsToUser).not.toHaveBeenCalled();
  });

  it('looks up each e-mail once and assigns each group to its own account', async () => {
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'a@example.com'),
      apartment('apt-2', 'b@example.com'),
      apartment('apt-3', 'a@example.com'),
    ]);
    mockFindUserByEmail.mockImplementation(async (email: string) => ({
      id: email === 'a@example.com' ? 'user-a' : 'user-b',
    }));
    mockAssignApartmentsToUser
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2', 'apt-3']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 3, skipped: 0, errors: 0 },
    });
    expect(mockFindUserByEmail).toHaveBeenCalledTimes(2);
    expect(mockAssignApartmentsToUser).toHaveBeenNthCalledWith(1, 'user-a', [
      'apt-1',
      'apt-3',
    ]);
    expect(mockAssignApartmentsToUser).toHaveBeenNthCalledWith(2, 'user-b', [
      'apt-2',
    ]);
  });

  it('counts every apartment of a failing e-mail as an error and continues with the next e-mail', async () => {
    const assignError = new Error('write failed');
    mockFindUnassignedForAssign.mockResolvedValueOnce([
      apartment('apt-1', 'a@example.com'),
      apartment('apt-2', 'b@example.com'),
      apartment('apt-3', 'a@example.com'),
    ]);
    mockFindUserByEmail.mockImplementation(async (email: string) => ({
      id: email === 'a@example.com' ? 'user-a' : 'user-b',
    }));
    mockAssignApartmentsToUser
      .mockRejectedValueOnce(assignError)
      .mockResolvedValueOnce(1);

    const result = await bulkAssignAccounts(['apt-1', 'apt-2', 'apt-3']);

    expect(result).toEqual({
      ok: true,
      data: { assigned: 1, skipped: 0, errors: 2 },
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      { err: assignError, apartmentIds: ['apt-1', 'apt-3'] },
      'Failed to assign existing user'
    );
  });

  it('returns a failed result and logs the error when the apartments cannot be loaded', async () => {
    const error = new Error('DB down');
    mockFindUnassignedForAssign.mockRejectedValueOnce(error);

    const result = await bulkAssignAccounts(['apt-1']);

    expect(result).toEqual({
      ok: false,
      code: 'failed',
      message: 'Nie udało się przypisać mieszkań',
    });
    expect(mockLog.error).toHaveBeenCalledWith({ error }, 'Bulk assign failed');
    expect(mockAssignApartmentsToUser).not.toHaveBeenCalled();
  });
});

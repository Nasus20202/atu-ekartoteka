import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileContent } from '@/components/account/profile-content';
import { AuthMethod } from '@/lib/types';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUserProfileCached: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  form: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/queries/users/find-user-profile', () => ({
  findUserProfileCached: mocks.findUserProfileCached,
}));
vi.mock('@/components/account/profile-form', () => ({
  ProfileForm: (props: unknown) => {
    mocks.form(props);
    return <div>form</div>;
  },
}));

describe('ProfileContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('renders the profile form for the signed-in user', async () => {
    mocks.findUserProfileCached.mockResolvedValue({
      name: 'Jan',
      authMethod: AuthMethod.CREDENTIALS,
    });

    render(await ProfileContent());

    expect(screen.getByText('Edytuj profil')).toBeInTheDocument();
    expect(mocks.findUserProfileCached).toHaveBeenCalledWith('user-1');
    expect(mocks.form).toHaveBeenCalledWith({
      initialName: 'Jan',
      authMethod: AuthMethod.CREDENTIALS,
    });
  });

  it('falls back to credentials when the auth method is missing', async () => {
    mocks.findUserProfileCached.mockResolvedValue({
      name: null,
      authMethod: null,
    });

    render(await ProfileContent());

    expect(mocks.form).toHaveBeenCalledWith({
      initialName: null,
      authMethod: AuthMethod.CREDENTIALS,
    });
  });

  it('redirects anonymous visitors to the login page', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(ProfileContent()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(mocks.findUserProfileCached).not.toHaveBeenCalled();
  });

  it('redirects to the login page when the user no longer exists', async () => {
    mocks.findUserProfileCached.mockResolvedValue(null);

    await expect(ProfileContent()).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});

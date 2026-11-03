import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HoaListSection } from '@/components/apartments/hoa-list-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  findHoas: vi.fn(),
}));

vi.mock('@/actions/hoa', () => ({ renameHoaAction: vi.fn() }));
vi.mock('@/lib/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/queries/hoa/find-hoas', () => ({ findHoas: mocks.findHoas }));

describe('HoaListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.findHoas.mockResolvedValue([
      {
        id: 'hoa-1',
        externalId: 'W001',
        name: 'Wspólnota Testowa',
        _count: { apartments: 2 },
        apartmentsDataDate: null,
        chargesDataDate: null,
        notificationsDataDate: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]);
  });

  it('renders every HOA from the database', async () => {
    render(await HoaListSection());

    expect(mocks.findHoas).toHaveBeenCalledWith('');
    expect(screen.getByText('Wspólnota Testowa')).toBeInTheDocument();
  });

  it('does not query when the admin check fails', async () => {
    mocks.requireAdminAccess.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(HoaListSection()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.findHoas).not.toHaveBeenCalled();
  });
});

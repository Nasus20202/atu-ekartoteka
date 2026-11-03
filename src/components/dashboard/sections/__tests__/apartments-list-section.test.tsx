import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApartmentsListSection } from '@/components/dashboard/sections/apartments-list-section';

const mocks = vi.hoisted(() => ({ account: vi.fn(), apartments: vi.fn() }));

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mocks.account(),
  loadApartmentsWithCharges: () => mocks.apartments(),
}));
vi.mock('@/components/dashboard/apartments-section', () => ({
  ApartmentsSection: ({ apartments }: { apartments: unknown[] }) => (
    <div>Mieszkania {apartments.length}</div>
  ),
}));

describe('ApartmentsListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ status: 'APPROVED' });
    mocks.apartments.mockResolvedValue([{ id: 'apt-1' }]);
  });

  it('renders the apartments of an approved user', async () => {
    render(await ApartmentsListSection());

    expect(screen.getByText('Mieszkania 1')).toBeInTheDocument();
  });

  it('renders the empty state for an approved user without apartments', async () => {
    mocks.apartments.mockResolvedValue([]);

    render(await ApartmentsListSection());

    expect(screen.getByText('Mieszkania 0')).toBeInTheDocument();
  });

  it('renders nothing for a pending user', async () => {
    mocks.account.mockResolvedValue({ status: 'PENDING' });

    expect(await ApartmentsListSection()).toBeNull();
  });
});

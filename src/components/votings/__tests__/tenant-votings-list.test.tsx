import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TenantVotingsList } from '@/components/votings/tenant-votings-list';

const mocks = vi.hoisted(() => ({
  requireApprovedTenant: vi.fn(),
  findTenantVotings: vi.fn(),
}));

vi.mock('@/lib/framework/auth/require-approved-tenant', () => ({
  requireApprovedTenant: mocks.requireApprovedTenant,
}));
vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));
vi.mock('@/lib/voting/queries/find-tenant-votings', () => ({
  findTenantVotings: mocks.findTenantVotings,
}));

function row(id: string, status: string, ballots = 0) {
  return {
    id,
    title: `Głosowanie ${id}`,
    status,
    endsAt: null,
    hoa: { name: 'Lipowa', _count: { apartments: 1 } },
    _count: { questions: 2, ballots },
  };
}

describe('TenantVotingsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApprovedTenant.mockResolvedValue({ userId: 'user-1' });
  });

  it('shows an empty state without votings', async () => {
    mocks.findTenantVotings.mockResolvedValue([]);

    render(await TenantVotingsList());

    expect(screen.getByText('Brak głosowań')).toBeInTheDocument();
  });

  it('groups active votings and published results under their own headings', async () => {
    mocks.findTenantVotings.mockImplementation(
      async (_user: string, statuses: string[]) =>
        statuses[0] === 'ACTIVE'
          ? [row('a', 'ACTIVE')]
          : [row('r', 'RESULTS_PUBLISHED')]
    );

    render(await TenantVotingsList());

    expect(
      screen.getByRole('heading', { name: 'Aktywne głosowania' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Wyniki głosowań' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('voting-card-a')).toHaveTextContent(
      'Czeka na Twój głos'
    );
    expect(screen.getByTestId('voting-card-r')).toHaveTextContent(
      'Zobacz wyniki'
    );
  });

  it('leaves out a heading without votings', async () => {
    mocks.findTenantVotings.mockImplementation(
      async (_user: string, statuses: string[]) =>
        statuses[0] === 'ACTIVE' ? [row('a', 'ACTIVE', 1)] : []
    );

    render(await TenantVotingsList());

    expect(
      screen.queryByRole('heading', { name: 'Wyniki głosowań' })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('voting-card-a')).not.toHaveTextContent(
      'Czeka na Twój głos'
    );
  });
});

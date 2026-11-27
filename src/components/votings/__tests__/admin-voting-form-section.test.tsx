import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminVotingFormSection } from '@/components/votings/admin-voting-form-section';

const mocks = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
  findHoas: vi.fn(),
  findVotingById: vi.fn(),
  form: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/framework/auth/require-admin-access', () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock('@/lib/hoa/queries/find-hoas', () => ({ findHoas: mocks.findHoas }));
vi.mock('@/lib/voting/queries/find-voting-by-id', () => ({
  findVotingById: mocks.findVotingById,
}));
vi.mock('@/components/votings/voting-form', () => ({
  VotingForm: (props: unknown) => {
    mocks.form(props);
    return <div>form</div>;
  },
}));

describe('AdminVotingFormSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminAccess.mockResolvedValue({});
    mocks.findHoas.mockResolvedValue([
      { id: 'h1', name: 'Lipowa', externalId: 'L1' },
    ]);
  });

  it('opens an empty form for a new voting', async () => {
    render(await AdminVotingFormSection({}));

    expect(screen.getByText('form')).toBeInTheDocument();
    expect(mocks.form).toHaveBeenCalledWith({
      hoas: [{ id: 'h1', name: 'Lipowa' }],
      initial: expect.objectContaining({ hoaId: '', title: '', questions: [] }),
    });
  });

  it('fills the form from an existing draft', async () => {
    mocks.findVotingById.mockResolvedValue({
      id: 'v1',
      title: 'Remont',
      description: null,
      status: 'DRAFT',
      endsAt: new Date('2026-12-01T10:00:00Z'),
      hoa: { id: 'h1', name: 'Lipowa' },
      questions: [{ id: 'q1', position: 0, text: 'Czy?' }],
    });

    render(await AdminVotingFormSection({ votingId: 'v1' }));

    expect(mocks.form).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: {
          votingId: 'v1',
          hoaId: 'h1',
          title: 'Remont',
          description: '',
          endsAt: '2026-12-01T10:00:00.000Z',
          questions: ['Czy?'],
        },
      })
    );
  });

  it.each([[null], [{ status: 'ACTIVE' }]])(
    'is not found for a missing or published voting: %j',
    async (voting) => {
      mocks.findVotingById.mockResolvedValue(voting);

      await expect(AdminVotingFormSection({ votingId: 'v1' })).rejects.toThrow(
        'NEXT_NOT_FOUND'
      );
    }
  );

  it('keeps a draft without a deadline free of one', async () => {
    mocks.findVotingById.mockResolvedValue({
      id: 'v1',
      title: 'T',
      description: 'Opis',
      status: 'DRAFT',
      endsAt: null,
      hoa: { id: 'h1', name: 'Lipowa' },
      questions: [],
    });

    render(await AdminVotingFormSection({ votingId: 'v1' }));

    expect(mocks.form).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: expect.objectContaining({ endsAt: null, description: 'Opis' }),
      })
    );
  });
});

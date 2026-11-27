import { vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  resolveOpenVoting: vi.fn(),
  findVotableApartments: vi.fn(),
  findRecent: vi.fn(),
  saveVoteConfirmation: vi.fn(),
  deleteVoteConfirmation: vi.fn(),
  findUserById: vi.fn(),
  send: vi.fn(),
  metrics: { recordConfirmation: vi.fn() },
}));

export const mocks = hoisted;

vi.mock('@/lib/voting/use-cases/vote-access', () => ({
  resolveOpenVoting: hoisted.resolveOpenVoting,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findVotableApartments: hoisted.findVotableApartments,
}));
vi.mock('@/lib/voting/queries/find-recent-vote-confirmation', () => ({
  findRecentVoteConfirmation: hoisted.findRecent,
}));
vi.mock('@/lib/voting/mutations/save-vote-confirmation', () => ({
  saveVoteConfirmation: hoisted.saveVoteConfirmation,
}));
vi.mock('@/lib/voting/mutations/delete-vote-confirmation', () => ({
  deleteVoteConfirmation: hoisted.deleteVoteConfirmation,
}));
vi.mock('@/lib/users/queries/find-user-by-id', () => ({
  findUserById: hoisted.findUserById,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({ sendVoteConfirmationEmail: hoisted.send }),
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/lib/platform/opentelemetry/voting-metrics', () => ({
  votingMetrics: hoisted.metrics,
}));

export const VOTING = {
  voting: {
    id: 'v1',
    title: 'Remont',
    hoa: { id: 'hoa-1' },
    allowAbstain: true,
    questions: [
      { id: 'q1', text: 'Dach?' },
      { id: 'q2', text: 'Firma A?' },
    ],
  },
};
export const ONE = { q1: 'FOR', q2: 'AGAINST' };
export const ANSWERS = { 'apt-1': ONE };
const apartment = (id: string, number: string) => ({
  id,
  address: 'Lipowa',
  building: '1',
  number,
});

export function primeRequestMocks() {
  vi.clearAllMocks();
  mocks.resolveOpenVoting.mockResolvedValue(VOTING);
  mocks.findVotableApartments.mockResolvedValue([
    apartment('apt-1', '1'),
    apartment('apt-2', '2'),
  ]);
  mocks.findRecent.mockResolvedValue(null);
  mocks.saveVoteConfirmation.mockResolvedValue('c1');
  mocks.findUserById.mockResolvedValue({
    email: 'jan@example.com',
    name: 'Jan',
  });
  mocks.send.mockResolvedValue({ ok: true, delivery: 'sent' });
}

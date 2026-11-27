import { vi } from 'vitest';

import { generateConfirmationToken } from '@/lib/voting/rules/confirmation-token';

const hoisted = vi.hoisted(() => ({
  resolveOpenVoting: vi.fn(),
  findByToken: vi.fn(),
  deleteConfirmation: vi.fn(),
  castBallots: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  metrics: { recordConfirmation: vi.fn(), recordBallots: vi.fn() },
}));

export const mocks = hoisted;

vi.mock('@/lib/voting/use-cases/vote-access', () => ({
  resolveOpenVoting: hoisted.resolveOpenVoting,
  VOTING_ENDED: 'Głosowanie zostało zakończone',
}));
vi.mock('@/lib/voting/queries/find-vote-confirmation', () => ({
  findVoteConfirmationByToken: hoisted.findByToken,
}));
vi.mock('@/lib/voting/queries/find-voter-apartments', () => ({
  findOwnedApartments: async (_u: string, _h: string, ids: string[]) =>
    ids
      .filter((id) => id.startsWith('apt'))
      .map((id) => ({ id, address: 'Lipowa', building: '1', number: id })),
}));
vi.mock('@/lib/voting/mutations/delete-vote-confirmation', () => ({
  deleteVoteConfirmation: hoisted.deleteConfirmation,
}));
vi.mock('@/lib/voting/mutations/cast-ballots', () => ({
  castBallots: hoisted.castBallots,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => hoisted.log,
}));
vi.mock('@/lib/platform/opentelemetry/voting-metrics', () => ({
  votingMetrics: hoisted.metrics,
}));

export const TOKEN = generateConfirmationToken();
export const ANSWERS = { 'apt-1': { q1: 'FOR' } };

export function pending(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    votingId: 'v1',
    userId: 'user-1',
    answers: ANSWERS,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

export function primeConfirmVoteMocks() {
  vi.clearAllMocks();
  mocks.resolveOpenVoting.mockResolvedValue({
    voting: { id: 'v1', hoa: { id: 'hoa-1' }, questions: [{ id: 'q1' }] },
  });
  mocks.findByToken.mockResolvedValue(pending());
  mocks.castBallots.mockResolvedValue({ ok: true, ballots: 2 });
}

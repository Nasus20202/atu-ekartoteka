import type { Meter, ObservableResult } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  adds: new Map<string, ReturnType<typeof vi.fn>>(),
  countVotingsByStatus: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@opentelemetry/api', () => ({
  metrics: {
    getMeter: () => ({
      createCounter: (name: string) => {
        const add = vi.fn();
        mocks.adds.set(name, add);
        return { add };
      },
    }),
  },
}));
vi.mock('@/lib/platform/database/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/voting/queries/count-votings-by-status', () => ({
  countVotingsByStatus: mocks.countVotingsByStatus,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  logger: { error: mocks.loggerError },
}));

import { COUNT_REFRESH_INTERVAL_MS } from '@/lib/platform/opentelemetry/database-metrics';
import {
  registerVotingCountMetrics,
  votingMetrics,
} from '@/lib/platform/opentelemetry/voting-metrics';
import { VotingStatus } from '@/lib/voting/types/voting';

function adds(name: string) {
  const add = mocks.adds.get(name);
  if (!add) throw new Error(`No counter named ${name}`);
  return add;
}

function createMeter() {
  let callback: ((result: ObservableResult) => void) | undefined;
  const meter = {
    createObservableGauge: vi.fn(() => ({
      addCallback: (cb: (result: ObservableResult) => void) => {
        callback = cb;
      },
    })),
  } as unknown as Meter;
  const observe = () => {
    const observed: [number, unknown][] = [];
    callback?.({
      observe: (value: number, attributes: unknown) =>
        observed.push([value, attributes]),
    } as ObservableResult);
    return observed;
  };
  return { meter, observe };
}

const COUNTS = {
  DRAFT: 1,
  ACTIVE: 2,
  CLOSED: 0,
  ARCHIVED: 4,
};

describe('votingMetrics', () => {
  beforeEach(() => {
    mocks.adds.forEach((add) => add.mockClear());
  });

  it.each([
    [VotingStatus.DRAFT, 'draft'],
    [VotingStatus.ACTIVE, 'active'],
    [VotingStatus.CLOSED, 'closed'],
    [VotingStatus.ARCHIVED, 'archived'],
  ])('counts a status change to %s as %s', (status, label) => {
    votingMetrics.recordStatusChange(status);

    expect(adds('ekartoteka.voting.status_change')).toHaveBeenCalledWith(1, {
      status: label,
    });
  });

  it('counts a confirmation step by its result', () => {
    votingMetrics.recordConfirmation({ result: 'requested' });
    votingMetrics.recordConfirmation({ result: 'confirmed' });

    expect(adds('ekartoteka.voting.confirmation').mock.calls).toEqual([
      [1, { result: 'requested' }],
      [1, { result: 'confirmed' }],
    ]);
  });

  it('counts a rejected link with its reason', () => {
    votingMetrics.recordConfirmation({
      result: 'rejected',
      reason: 'already_voted',
    });

    expect(adds('ekartoteka.voting.confirmation')).toHaveBeenCalledWith(1, {
      result: 'rejected',
      reason: 'already_voted',
    });
  });

  it('adds the ballots stored by a confirmation', () => {
    votingMetrics.recordBallots(3);

    expect(adds('ekartoteka.voting.ballot')).toHaveBeenCalledWith(3);
  });
});

describe('registerVotingCountMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.countVotingsByStatus.mockResolvedValue(COUNTS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('observes the number of votings per status, zero included', async () => {
    const { meter, observe } = createMeter();

    await registerVotingCountMetrics(meter);

    expect(meter.createObservableGauge).toHaveBeenCalledWith(
      'ekartoteka.voting.count',
      expect.anything()
    );
    expect(observe()).toEqual([
      [1, { status: 'draft' }],
      [2, { status: 'active' }],
      [0, { status: 'closed' }],
      [4, { status: 'archived' }],
    ]);
  });

  it('refreshes the counts on the database refresh interval', async () => {
    const { meter, observe } = createMeter();
    await registerVotingCountMetrics(meter);

    mocks.countVotingsByStatus.mockResolvedValue({ ...COUNTS, ACTIVE: 7 });
    await vi.advanceTimersByTimeAsync(COUNT_REFRESH_INTERVAL_MS);

    expect(observe()).toContainEqual([7, { status: 'active' }]);
  });

  it('reports nothing while no count has succeeded', async () => {
    mocks.countVotingsByStatus.mockRejectedValueOnce(new Error('db down'));
    const { meter, observe } = createMeter();
    await registerVotingCountMetrics(meter);

    expect(observe()).toEqual([]);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      'Failed to update voting counts'
    );
  });

  it('keeps the last good count when a refresh fails', async () => {
    const { meter, observe } = createMeter();
    await registerVotingCountMetrics(meter);

    mocks.countVotingsByStatus.mockRejectedValue(new Error('db down'));
    await vi.advanceTimersByTimeAsync(COUNT_REFRESH_INTERVAL_MS);

    expect(observe()).toContainEqual([2, { status: 'active' }]);
    expect(mocks.loggerError).toHaveBeenCalledTimes(1);
  });
});

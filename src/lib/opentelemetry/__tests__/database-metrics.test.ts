import type { Meter, ObservableResult } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockLoggerError } = vi.hoisted(() => {
  const counter = () => ({ count: vi.fn() });
  return {
    mockPrisma: {
      homeownersAssociation: counter(),
      apartment: counter(),
      charge: counter(),
      chargeNotification: counter(),
      payment: counter(),
      user: counter(),
    },
    mockLoggerError: vi.fn(),
  };
});

vi.mock('@/lib/database/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ logger: { error: mockLoggerError } }));

import { registerDatabaseMetrics } from '@/lib/opentelemetry/database-metrics';

const UPDATE_INTERVAL_MS = 30_000;

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

describe('registerDatabaseMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(mockPrisma).forEach((model, index) =>
      model.count.mockResolvedValue(index)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('observes the row count of every table', async () => {
    const { meter, observe } = createMeter();

    await registerDatabaseMetrics(meter);

    expect(observe()).toEqual([
      [0, { table: 'homeownersAssociation' }],
      [1, { table: 'apartment' }],
      [2, { table: 'charge' }],
      [3, { table: 'chargeNotification' }],
      [4, { table: 'payment' }],
      [5, { table: 'user' }],
    ]);
  });

  it('refreshes counts periodically', async () => {
    const { meter, observe } = createMeter();
    await registerDatabaseMetrics(meter);

    mockPrisma.user.count.mockResolvedValue(42);
    await vi.advanceTimersByTimeAsync(UPDATE_INTERVAL_MS);

    expect(observe()).toContainEqual([42, { table: 'user' }]);
  });

  it('logs failed counts and keeps the other tables', async () => {
    mockPrisma.charge.count.mockRejectedValue(new Error('db down'));
    const { meter, observe } = createMeter();

    await registerDatabaseMetrics(meter);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to update count for table charge: db down'
    );
    expect(observe()).not.toContainEqual([2, { table: 'charge' }]);
    expect(observe()).toHaveLength(5);
  });
});

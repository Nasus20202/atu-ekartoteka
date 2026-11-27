import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DESKTOP_WIDTH,
  setViewportWidth,
} from '@/components/import/__tests__/viewport';
import { DatabaseStatsCard } from '@/components/import/database-stats-card';
import { useDatabaseStats } from '@/components/import/use-database-stats';

const EMPTY = {
  count: 0,
  rangeFrom: null,
  rangeTo: null,
  lastChangedAt: null,
};

const SUMMARY = {
  hoa: EMPTY,
  apartments: { ...EMPTY, active: 0 },
  users: EMPTY,
  charges: EMPTY,
  notifications: EMPTY,
  payments: EMPTY,
  utilitySettlements: EMPTY,
  meterReadings: EMPTY,
  annualSettlements: EMPTY,
};

function Card() {
  const { dbStats, statsLoading, associations } = useDatabaseStats();

  return (
    <DatabaseStatsCard
      dbStats={dbStats}
      statsLoading={statsLoading}
      associations={associations}
    />
  );
}

describe('database statistics card while the associations load', () => {
  beforeEach(() => setViewportWidth(DESKTOP_WIDTH));
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the summary on screen and the section open', async () => {
    let respond: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(SUMMARY),
        })
        .mockReturnValueOnce(new Promise((resolve) => (respond = resolve)))
    );
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <Card />
      </SWRConfig>
    );
    const toggle = await screen.findByRole('button', {
      name: 'Według wspólnot',
    });

    await userEvent.click(toggle);

    expect(screen.queryByTestId('stats-skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('associations-skeleton')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    respond({
      ok: true,
      json: () => Promise.resolve({ ...SUMMARY, associations: [] }),
    });

    expect(await screen.findByText('Brak wspólnot')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

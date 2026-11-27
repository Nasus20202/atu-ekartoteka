import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { utilityDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { ReadingsTable } from '@/components/settlements/readings-table';
import {
  ALL_READINGS,
  type ReadingsQuery,
} from '@/lib/settlements/rules/readings-query';

const update = vi.hoisted(() => vi.fn());

vi.mock('@/components/settlements/use-settlement-params', () => ({
  useSettlementParams: () => ({ update }),
}));

const [meter] = utilityDto().utilities[0].meters;
const METERS = [
  { device: meter.device, label: meter.label },
  { device: 'CO 01', label: 'CO mieszkania' },
];

const renderTable = (
  readingsQuery: ReadingsQuery = ALL_READINGS,
  readings = [meter]
) =>
  render(
    <ReadingsTable
      readings={readings}
      readingMeters={METERS}
      readingsQuery={readingsQuery}
    />
  );

const header = (name: string) => screen.getByRole('columnheader', { name });

describe('ReadingsTable', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks the newest readings as the default order', () => {
    renderTable();

    expect(header('Data końc.')).toHaveAttribute('aria-sort', 'descending');
    expect(header('Zużycie')).toHaveAttribute('aria-sort', 'none');
  });

  it('asks for a column in ascending order, then reverses it', async () => {
    const { unmount } = renderTable();
    await userEvent.click(screen.getByRole('button', { name: 'Zużycie' }));

    expect(update).toHaveBeenCalledWith({
      readingSort: 'consumption',
      readingOrder: 'asc',
    });
    unmount();

    renderTable({
      meter: null,
      sort: { key: 'consumption', direction: 'asc' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Zużycie' }));

    expect(update).toHaveBeenLastCalledWith({
      readingSort: 'consumption',
      readingOrder: 'desc',
    });
  });

  it('narrows to one meter and back to all of them', async () => {
    const { unmount } = renderTable();
    await userEvent.click(screen.getByRole('button', { name: 'Licznik' }));
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'CO mieszkania (CO 01)' })
    );

    expect(update).toHaveBeenCalledWith({ meter: 'CO 01' });
    unmount();

    renderTable({ ...ALL_READINGS, meter: 'CO 01' });
    await userEvent.click(screen.getByRole('button', { name: 'Licznik' }));
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Wszystkie liczniki' })
    );

    expect(update).toHaveBeenLastCalledWith({ meter: null });
  });

  it('names a meter without its own label once', async () => {
    render(
      <ReadingsTable
        readings={[meter]}
        readingMeters={[...METERS, { device: 'XY 1', label: 'XY 1' }]}
        readingsQuery={ALL_READINGS}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Licznik' }));

    expect(
      screen.getByRole('menuitemradio', { name: 'XY 1' })
    ).toBeInTheDocument();
  });

  it('keeps the filter reachable while a meter is chosen', () => {
    render(
      <ReadingsTable
        readings={[]}
        readingMeters={[METERS[0]]}
        readingsQuery={{ ...ALL_READINGS, meter: 'XY 9' }}
      />
    );

    expect(screen.getByRole('button', { name: 'Licznik' })).toBeInTheDocument();
  });

  it('animates the rows in after a change', () => {
    renderTable();

    const [, body] = within(screen.getByRole('table')).getAllByRole('rowgroup');
    expect(body).toHaveClass('motion-safe:animate-view-switch');
  });

  it('says when the chosen meter has no reading', () => {
    renderTable({ ...ALL_READINGS, meter: 'XY 9' }, []);

    expect(
      screen.getByText('Brak odczytów wybranego licznika.')
    ).toBeInTheDocument();
  });
});

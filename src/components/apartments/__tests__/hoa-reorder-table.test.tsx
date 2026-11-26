import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { THREE_HOAS } from '@/components/apartments/__tests__/hoa-reorder-fixtures';
import { HoaReorderTable } from '@/components/apartments/hoa-reorder-table';

function bodyRows() {
  return screen.getAllByRole('row').slice(1);
}

describe('HoaReorderTable', () => {
  it('shows one row per HOA with its position, name, code and apartments', () => {
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={vi.fn()} />);

    const rows = bodyRows();
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getAllByRole('cell')[1]).toHaveTextContent('1');
    expect(within(rows[2]).getAllByRole('cell')[1]).toHaveTextContent('3');
    expect(within(rows[0]).getByText('Alfa')).toBeInTheDocument();
    expect(within(rows[0]).getByText('EXT-a')).toBeInTheDocument();
    expect(within(rows[0]).getByText('mieszkanie')).toBeInTheDocument();
    expect(within(rows[1]).getByText('mieszkania')).toBeInTheDocument();
    expect(within(rows[2]).getByText('mieszkań')).toBeInTheDocument();
  });

  it('shows the import date or a dash when there is none', () => {
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={vi.fn()} />);

    expect(
      screen.getByRole('columnheader', { name: 'Data importu mieszkań' })
    ).toBeInTheDocument();

    const rows = bodyRows();
    expect(within(rows[0]).getByText('—')).toBeInTheDocument();
    expect(within(rows[2]).getByText('21.11.2026')).toBeInTheDocument();
  });

  it('labels the table and the move controls of each HOA', () => {
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={vi.fn()} />);

    expect(
      screen.getByRole('table', { name: 'Kolejność wspólnot' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Przenieś wspólnotę Beta' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Beta wyżej' })
    ).toBeEnabled();
  });

  it('moves a HOA down with its arrow button', async () => {
    const onReorder = vi.fn();
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={onReorder} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Alfa niżej' })
    );

    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('moves a HOA up with its arrow button', async () => {
    const onReorder = vi.fn();
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={onReorder} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Gamma wyżej' })
    );

    expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b']);
  });

  it('cannot move the first HOA up or the last HOA down', () => {
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Alfa wyżej' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Przesuń wspólnotę Gamma niżej' })
    ).toBeDisabled();
  });

  it('gives the drag handle keyboard instructions', () => {
    render(<HoaReorderTable hoas={THREE_HOAS} onReorder={vi.fn()} />);

    const handle = screen.getByRole('button', {
      name: 'Przenieś wspólnotę Alfa',
    });
    const instructionsId = handle.getAttribute('aria-describedby');
    expect(instructionsId).toBeTruthy();
    expect(document.getElementById(instructionsId!)).toHaveTextContent(
      /Aby przenieść wspólnotę/
    );
  });
});

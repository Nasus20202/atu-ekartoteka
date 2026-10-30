import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ListViewSwitch } from '@/components/ui/list-view-switch';
import { ListViewMode } from '@/lib/hooks/use-list-view-mode';

describe('ListViewSwitch', () => {
  it('offers cards and table and marks the active view as pressed', () => {
    render(<ListViewSwitch value={ListViewMode.TABLE} onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Widok listy' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Kafelki' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('changes the view on click and with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListViewSwitch value={ListViewMode.CARDS} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Kafelki' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(ListViewMode.TABLE);

    await user.click(screen.getByRole('button', { name: 'Kafelki' }));
    expect(onChange).toHaveBeenLastCalledWith(ListViewMode.CARDS);
  });
});

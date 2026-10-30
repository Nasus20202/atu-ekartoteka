import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Circle, Square } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from '@/components/ui/segmented-control';

const THREE_OPTIONS = [
  { value: 'all', label: 'Wszystkie', icon: Circle },
  { value: 'active', label: 'Aktywne', icon: Square },
  { value: 'inactive', label: 'Nieaktywne' },
] as const;

describe('SegmentedControl', () => {
  it('renders every option and marks the active one as pressed', () => {
    render(
      <SegmentedControl
        label="Status"
        options={THREE_OPTIONS}
        value="active"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('group', { name: 'Status' })).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Aktywne' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Wszystkie' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Nieaktywne' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('changes the selection on click and with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Status"
        options={THREE_OPTIONS}
        value="all"
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Nieaktywne' }));
    expect(onChange).toHaveBeenLastCalledWith('inactive');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Aktywne' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('active');

    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('inactive');
  });
});

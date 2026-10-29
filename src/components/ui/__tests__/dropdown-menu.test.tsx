import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

describe('DropdownMenu', () => {
  it('opens and selects an item', async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Akcje</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Zatwierdź</DropdownMenuItem>
          <DropdownMenuItem inset>Wcięte</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Akcje' }));

    expect(screen.getByRole('menuitem', { name: 'Wcięte' })).toHaveClass(
      'pl-8'
    );
    expect(screen.getByRole('menuitem', { name: 'Zatwierdź' })).not.toHaveClass(
      'pl-8'
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Zatwierdź' }));

    expect(onSelect).toHaveBeenCalledOnce();
  });
});

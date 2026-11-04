import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HoaNoticesButton } from '@/components/apartments/hoa-notices-button';

vi.mock('@/components/apartments/hoa-notices-dialog', () => ({
  HoaNoticesDialog: ({ open }: { open: boolean }) => (
    <div>{open ? 'dialog open' : 'dialog closed'}</div>
  ),
}));

describe('HoaNoticesButton', () => {
  it('opens the notices dialog on click', async () => {
    const user = userEvent.setup();
    render(<HoaNoticesButton />);

    expect(screen.getByText('dialog closed')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /nagłówki i stopki/i })
    );

    expect(screen.getByText('dialog open')).toBeInTheDocument();
  });
});

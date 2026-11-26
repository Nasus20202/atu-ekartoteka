import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HoaReorderBar } from '@/components/apartments/hoa-reorder-bar';

describe('HoaReorderBar', () => {
  it('explains how to reorder and where the order is saved', () => {
    render(<HoaReorderBar customized onReset={vi.fn()} onDone={vi.fn()} />);

    expect(screen.getByText('Zmieniasz kolejność wspólnot.')).toBeVisible();
    expect(screen.getByText(/zapisuje się w tej przeglądarce/)).toBeVisible();
  });

  it('calls onDone from the done button', async () => {
    const onDone = vi.fn();
    render(<HoaReorderBar customized onReset={vi.fn()} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: 'Gotowe' }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('calls onReset from the reset button', async () => {
    const onReset = vi.fn();
    render(<HoaReorderBar customized onReset={onReset} onDone={vi.fn()} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Przywróć domyślną' })
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('disables the reset button while the order is the default one', () => {
    render(
      <HoaReorderBar customized={false} onReset={vi.fn()} onDone={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: 'Przywróć domyślną' })
    ).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PolicyToolbar } from '@/components/privacy/policy-toolbar';

const mocks = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.back, push: mocks.push }),
}));

describe('PolicyToolbar', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('goes back when the page has a history', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(3);
    render(<PolicyToolbar canPrint />);

    await userEvent.click(screen.getByRole('button', { name: /Wróć/ }));

    expect(mocks.back).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('opens the start page when there is nothing to go back to', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    render(<PolicyToolbar canPrint />);

    await userEvent.click(screen.getByRole('button', { name: /Wróć/ }));

    expect(mocks.push).toHaveBeenCalledWith('/');
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it('opens the print dialog', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PolicyToolbar canPrint />);

    await userEvent.click(
      screen.getByRole('button', { name: /Drukuj lub zapisz jako PDF/ })
    );

    expect(print).toHaveBeenCalled();
  });

  it('offers no printing when there is no policy', () => {
    render(<PolicyToolbar canPrint={false} />);

    expect(
      screen.queryByRole('button', { name: /Drukuj/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wróć/ })).toBeInTheDocument();
  });

  it('stays off the printed page', () => {
    const { container } = render(<PolicyToolbar canPrint />);

    expect(container.firstChild).toHaveClass('print:hidden');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ErrorPage from '@/app/error';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('ErrorPage', () => {
  const reset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries by calling reset', async () => {
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Spróbuj ponownie/i })
    );

    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard and resets the boundary', async () => {
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Powrót do strony głównej/i })
    );

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

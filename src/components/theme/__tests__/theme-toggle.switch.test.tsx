import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { mockSetTheme, theme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  theme: { current: 'light' },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: theme.current, setTheme: mockSetTheme }),
}));

import { ThemeToggle } from '@/components/theme/theme-toggle';

describe('ThemeToggle switching', () => {
  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ])('switches from %s to %s', async (current, next) => {
    theme.current = current;
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button'));

    expect(mockSetTheme).toHaveBeenCalledWith(next);
  });
});

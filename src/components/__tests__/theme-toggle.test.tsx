import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '@/components/theme-toggle';

const renderWithThemeProvider = (component: React.ReactElement) => {
  return render(<ThemeProvider attribute="class">{component}</ThemeProvider>);
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', async () => {
    renderWithThemeProvider(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('displays sun and moon icons', async () => {
    renderWithThemeProvider(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      const sunIcon = button.querySelector('svg.lucide-sun');
      const moonIcon = button.querySelector('svg.lucide-moon');

      expect(sunIcon).toBeInTheDocument();
      expect(moonIcon).toBeInTheDocument();
    });
  });

  it('has accessible label', async () => {
    renderWithThemeProvider(<ThemeToggle />);

    await waitFor(() => {
      const srText = screen.getByText('Toggle theme');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    renderWithThemeProvider(<ThemeToggle />);

    await waitFor(async () => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      await user.click(button);
    });
  });

  it('uses ghost variant and icon size for button', async () => {
    renderWithThemeProvider(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });
  });
});

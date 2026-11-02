import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-themes', () => ({
  // ThemeProvider injects a <script>, which React 19 warns about in tests.
  // The rendering assertions below do not need the provider.
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

import { ThemeToggle } from '@/components/theme/theme-toggle';

const renderThemeToggle = () => render(<ThemeToggle />);

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', async () => {
    renderThemeToggle();

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('displays sun and moon icons', async () => {
    renderThemeToggle();

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
    renderThemeToggle();

    await waitFor(() => {
      const srText = screen.getByText('Przełącz motyw');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });
  });

  it('uses ghost variant and icon size for button', async () => {
    renderThemeToggle();

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import packageJson from '@/../package.json';
import { AppFooter } from '@/components/layout/app-footer';

describe('AppFooter', () => {
  it('shows the version on the left and the policy link on the right', () => {
    render(<AppFooter />);

    const footer = screen.getByRole('contentinfo');
    const version = screen.getByText(`v${packageJson.version}`);
    const link = screen.getByRole('link', { name: 'Polityka prywatności' });

    expect(footer).toHaveClass('justify-between');
    expect(footer.firstElementChild).toBe(version);
    expect(footer.lastElementChild).toBe(link);
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('keeps the link legible and 44 px tall, and the version quieter', () => {
    render(<AppFooter />);

    expect(screen.getByRole('link')).toHaveClass(
      'text-muted-foreground',
      'min-h-11',
      'hover:underline'
    );
    expect(screen.getByText(/^v\d/)).toHaveClass('text-muted-foreground/60');
  });

  it('is part of the page flow, not fixed to the screen', () => {
    render(<AppFooter />);

    expect(screen.getByRole('contentinfo')).not.toHaveClass(
      'fixed',
      'absolute'
    );
  });

  it('keeps clear of the home indicator on a phone', () => {
    render(<AppFooter />);

    expect(screen.getByRole('contentinfo').className).toContain(
      'pb-[env(safe-area-inset-bottom)]'
    );
  });
});

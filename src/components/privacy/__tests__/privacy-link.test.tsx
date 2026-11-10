import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PrivacyLink } from '@/components/privacy/privacy-link';

describe('PrivacyLink', () => {
  it('links to the policy page', () => {
    render(<PrivacyLink />);

    expect(
      screen.getByRole('link', { name: 'Polityka prywatności' })
    ).toHaveAttribute('href', '/privacy');
  });

  it('accepts extra classes', () => {
    render(<PrivacyLink className="custom" />);

    expect(screen.getByRole('link')).toHaveClass('custom', 'min-h-11');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { metadata } from '@/app/privacy/layout';
import PrivacyPage from '@/app/privacy/page';

vi.mock('@/components/privacy/privacy-policy-section', () => ({
  PrivacyPolicySection: () => <div>policy</div>,
}));

describe('PrivacyPage', () => {
  it('wraps the policy in a page with a main landmark', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has the policy title', () => {
    expect(metadata.title).toBe('Polityka prywatności');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyLayout from '@/app/privacy/layout';

describe('PrivacyLayout', () => {
  it('shows the content above the footer', () => {
    render(<PrivacyLayout>{<p>polityka</p>}</PrivacyLayout>);

    expect(
      screen
        .getByText('polityka')
        .compareDocumentPosition(screen.getByRole('contentinfo')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

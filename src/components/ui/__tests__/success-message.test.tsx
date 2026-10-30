import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SuccessMessage } from '@/components/ui/success-message';

describe('SuccessMessage', () => {
  it('renders the message as a status', () => {
    render(<SuccessMessage>Zapisano</SuccessMessage>);

    expect(screen.getByRole('status')).toHaveTextContent('Zapisano');
  });
});

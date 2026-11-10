import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders a multi-line field with the shared field styles', () => {
    render(<Textarea aria-label="Treść" />);

    expect(screen.getByRole('textbox', { name: 'Treść' })).toHaveClass(
      'rounded-md',
      'border',
      'min-h-24'
    );
  });

  it('accepts typed text and a custom class', async () => {
    const onChange = vi.fn();
    render(
      <Textarea aria-label="Treść" className="font-mono" onChange={onChange} />
    );
    const field = screen.getByRole('textbox');

    await userEvent.setup().type(field, 'a{enter}b');

    expect(field).toHaveValue('a\nb');
    expect(field).toHaveClass('font-mono');
    expect(onChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Textarea aria-label="Treść" disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

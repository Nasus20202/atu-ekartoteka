import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders label element', () => {
    render(<Label>Username</Label>);
    const label = screen.getByText('Username');
    expect(label).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<Label data-testid="label">Label text</Label>);
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('applies custom className', () => {
    render(
      <Label className="custom-label" data-testid="label">
        Custom
      </Label>
    );
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('custom-label');
  });

  it('accepts htmlFor attribute', () => {
    render(<Label htmlFor="email">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('renders with associated input', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" type="text" />
      </div>
    );

    const label = screen.getByText('Test Label');
    const input = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('supports children elements', () => {
    render(
      <Label>
        <span>Nested</span> Content
      </Label>
    );

    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText(/Content/)).toBeInTheDocument();
  });
});

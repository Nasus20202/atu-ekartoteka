import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('flex', 'rounded-md', 'border');
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');

    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('accepts different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    let input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'text');

    rerender(<Input type="email" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input');
  });

  it('handles onChange event', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} placeholder="Change me" />);
    const input = screen.getByPlaceholderText('Change me');

    await user.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('accepts value prop', () => {
    render(
      <Input value="preset value" onChange={() => {}} data-testid="input" />
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveValue('preset value');
  });

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('accepts maxLength attribute', () => {
    render(<Input maxLength={10} data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('accepts required attribute', () => {
    render(<Input required data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toBeRequired();
  });

  it('accepts readOnly attribute', () => {
    render(<Input readOnly value="Read only" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('readOnly');
  });
});

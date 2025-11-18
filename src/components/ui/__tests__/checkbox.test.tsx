import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('should render unchecked by default', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('should render checked when checked prop is true', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('should call onCheckedChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle state when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not call onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Checkbox className="custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('should render with id attribute', () => {
    render(<Checkbox id="test-checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'test-checkbox');
  });

  it('should work with label association', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <div>
        <label htmlFor="test-checkbox">Test Label</label>
        <Checkbox id="test-checkbox" onCheckedChange={handleChange} />
      </div>
    );

    const label = screen.getByText('Test Label');
    await user.click(label);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should handle indeterminate state', () => {
    render(<Checkbox checked="indeterminate" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });

  it('should accept and forward ref', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should support keyboard interaction', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await user.keyboard(' ');

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should maintain checked state across multiple clicks', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(false);
  });
});

import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('renders without crashing', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with horizontal orientation by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('renders with vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('custom');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Separator ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('accepts other HTML attributes', () => {
    const { container } = render(<Separator data-testid="custom-separator" />);
    expect(
      container.querySelector('[data-testid="custom-separator"]')
    ).toBeInTheDocument();
  });
});

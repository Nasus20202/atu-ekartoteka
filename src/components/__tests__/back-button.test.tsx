import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BackButton } from '@/components/back-button';

const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe('BackButton', () => {
  it('renders back button', () => {
    render(<BackButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls router.back when clicked', async () => {
    const user = userEvent.setup();
    render(<BackButton />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('has ArrowLeft icon', () => {
    const { container } = render(<BackButton />);

    const icon = container.querySelector('svg.lucide-arrow-left');
    expect(icon).toBeInTheDocument();
  });

  it('has correct size classes', () => {
    const { container } = render(<BackButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-12', 'w-12');

    // Icon size is controlled by [&_svg]:!size-6 utility
    const icon = container.querySelector('svg.lucide-arrow-left');
    expect(icon).toBeInTheDocument();
  });
});

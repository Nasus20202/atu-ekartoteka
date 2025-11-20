import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageHeader } from '@/components/page-header';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Test Title'
    );
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Title" />);

    const description = container.querySelector('.text-muted-foreground');
    expect(description).not.toBeInTheDocument();
  });

  it('shows back button by default', () => {
    render(<PageHeader title="Title" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('hides back button when showBackButton is false', () => {
    render(<PageHeader title="Title" showBackButton={false} />);

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('has correct layout classes', () => {
    const { container } = render(
      <PageHeader title="Title" description="Description" />
    );

    const wrapper = container.querySelector('.mb-6.flex.items-center.gap-4');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders title with correct styling', () => {
    render(<PageHeader title="Title" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-3xl', 'font-bold');
  });

  it('renders description with correct styling', () => {
    const { container } = render(
      <PageHeader title="Title" description="Description" />
    );

    const description = screen.getByText('Description');
    expect(description).toHaveClass('text-muted-foreground');
  });
});

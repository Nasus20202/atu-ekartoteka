import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageHeader } from '@/components/layout/page-header';

// The sticky header measures its sentinel; jsdom has no layout, so put it
// where the browser puts it on an unscrolled page, below the navbar
const SENTINEL_TOP_AT_REST = 200;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

describe('PageHeader', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: SENTINEL_TOP_AT_REST,
      bottom: SENTINEL_TOP_AT_REST,
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

    const wrapper = container.querySelector('.flex.flex-wrap.items-center');
    expect(wrapper).toBeInTheDocument();
  });

  it('pins below the navbar and is not stuck at rest', () => {
    const { container } = render(<PageHeader title="Title" />);

    const header = container.querySelector('[data-stuck]');
    expect(header).toHaveClass('sticky', 'top-[65px]');
    expect(header).toHaveAttribute('data-stuck', 'false');
  });

  it('applies a custom class to the sticky header', () => {
    const { container } = render(
      <PageHeader title="Title" className="custom-class" />
    );

    expect(container.querySelector('[data-stuck]')).toHaveClass('custom-class');
  });

  it('renders title with correct styling', () => {
    render(<PageHeader title="Title" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-2xl', 'font-bold');
  });

  it('renders description with correct styling', () => {
    render(<PageHeader title="Title" description="Description" />);

    const description = screen.getByText('Description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('renders an action when provided', () => {
    render(<PageHeader title="Tytuł" action={<button>Akcja</button>} />);

    expect(screen.getByRole('button', { name: 'Akcja' })).toBeInTheDocument();
  });
});

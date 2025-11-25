import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingCard } from '@/components/ui/loading-card';

describe('LoadingCard', () => {
  it('renders LoadingCard component with default message', () => {
    render(<LoadingCard data-testid="loading-card" />);
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toBeInTheDocument();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });

  it('renders LoadingCard with custom message', () => {
    render(
      <LoadingCard
        message="Custom loading message"
        data-testid="loading-card"
      />
    );
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toBeInTheDocument();
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('applies Card wrapper classes', () => {
    render(<LoadingCard data-testid="loading-card" />);
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toHaveClass('rounded-xl', 'border', 'bg-card');
  });

  it('renders with spinner icon', () => {
    render(<LoadingCard data-testid="loading-card" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies flex layout to CardContent', () => {
    render(<LoadingCard data-testid="loading-card" />);
    const cardContent = screen.getByTestId('loading-card').firstElementChild;
    expect(cardContent).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'gap-3',
      'py-12'
    );
  });

  it('applies muted text color to message', () => {
    render(<LoadingCard message="Test message" data-testid="loading-card" />);
    const message = screen.getByText('Test message');
    expect(message).toHaveClass('text-muted-foreground');
  });

  it('applies correct spinner size and color', () => {
    render(<LoadingCard data-testid="loading-card" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('h-8', 'w-8', 'text-muted-foreground');
  });

  it('renders empty message when message prop is empty string', () => {
    const { container } = render(
      <LoadingCard message="" data-testid="loading-card" />
    );
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toBeInTheDocument();
    const messageElement = container.querySelector(
      '[data-testid="loading-card"] p'
    );
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent('');
  });

  it('handles long messages correctly', () => {
    const longMessage =
      'This is a very long loading message that should still render properly without breaking the layout';
    render(<LoadingCard message={longMessage} data-testid="loading-card" />);
    const message = screen.getByText(longMessage);
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-muted-foreground');
  });

  it('applies custom className when provided', () => {
    render(<LoadingCard className="custom-class" data-testid="loading-card" />);
    const loadingCard = screen.getByTestId('loading-card');
    expect(loadingCard).toHaveClass('custom-class');
  });

  it('renders without data-testid when not provided', () => {
    render(<LoadingCard />);
    const loadingCard = document.querySelector('.rounded-xl.border.bg-card');
    expect(loadingCard).toBeInTheDocument();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });
});

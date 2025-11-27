import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Test alert</Alert>);
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Alert className="custom">Test</Alert>);
    expect(screen.getByText('Test')).toHaveClass('custom');
  });

  it('has role="alert"', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Alert>Test</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'bg-background',
      'text-foreground',
      'border-border'
    );
  });

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Error</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'border-destructive/50',
      'bg-destructive/10',
      'text-destructive'
    );
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Alert ref={ref}>Test</Alert>);
    expect(ref).toHaveBeenCalled();
  });

  it('accepts other HTML attributes', () => {
    render(<Alert data-testid="custom-alert">Test</Alert>);
    expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
  });
});

describe('AlertTitle', () => {
  it('renders title text', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass(
      'mb-1',
      'font-medium',
      'leading-none',
      'tracking-tight'
    );
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Test Title</AlertTitle>);
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('custom-title');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<AlertTitle ref={ref}>Test Title</AlertTitle>);
    expect(ref).toHaveBeenCalled();
  });

  it('renders as h5 element', () => {
    render(<AlertTitle>Test Title</AlertTitle>);
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H5');
  });
});

describe('AlertDescription', () => {
  it('renders description text', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(
      <AlertDescription className="custom-desc">
        Test Description
      </AlertDescription>
    );
    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('custom-desc');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<AlertDescription ref={ref}>Test Description</AlertDescription>);
    expect(ref).toHaveBeenCalled();
  });

  it('renders as div element', () => {
    render(<AlertDescription>Test Description</AlertDescription>);
    const description = screen.getByText('Test Description');
    expect(description.tagName).toBe('DIV');
  });
});

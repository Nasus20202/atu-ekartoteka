import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Page } from '@/components/page';

describe('Page', () => {
  it('renders children', () => {
    render(
      <Page>
        <div>Test content</div>
      </Page>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default max-width of 6xl', () => {
    const { container } = render(
      <Page>
        <div>Content</div>
      </Page>
    );

    const innerDiv = container.querySelector('.max-w-6xl');
    expect(innerDiv).toBeInTheDocument();
  });

  it('applies custom max-width', () => {
    const { container } = render(
      <Page maxWidth="4xl">
        <div>Content</div>
      </Page>
    );

    const innerDiv = container.querySelector('.max-w-4xl');
    expect(innerDiv).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Page className="custom-class">
        <div>Content</div>
      </Page>
    );

    const innerDiv = container.querySelector('.custom-class');
    expect(innerDiv).toBeInTheDocument();
  });

  it('has correct structure', () => {
    const { container } = render(
      <Page>
        <div>Content</div>
      </Page>
    );

    const outerDiv = container.querySelector('.min-h-screen.bg-background');
    expect(outerDiv).toBeInTheDocument();

    const main = container.querySelector('main.p-8');
    expect(main).toBeInTheDocument();

    const innerDiv = container.querySelector('.mx-auto');
    expect(innerDiv).toBeInTheDocument();
  });

  it('supports all max-width options', () => {
    const widths = [
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '4xl',
      '6xl',
      '7xl',
    ] as const;

    widths.forEach((width) => {
      const { container } = render(
        <Page maxWidth={width}>
          <div>Content</div>
        </Page>
      );

      const innerDiv = container.querySelector(`.max-w-${width}`);
      expect(innerDiv).toBeInTheDocument();
    });
  });
});

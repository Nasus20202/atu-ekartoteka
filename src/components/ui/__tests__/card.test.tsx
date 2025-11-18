import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders Card component', () => {
    render(<Card data-testid="card">Card content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Card content');
  });

  it('applies default Card classes', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-xl', 'border', 'bg-card');
  });

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders CardHeader component', () => {
    render(<CardHeader data-testid="header">Header content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header content');
  });

  it('applies default CardHeader classes', () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('flex', 'flex-col', 'p-6');
  });

  it('applies custom className to CardHeader', () => {
    render(
      <CardHeader className="custom-header" data-testid="header">
        Content
      </CardHeader>
    );
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardTitle', () => {
  it('renders CardTitle component', () => {
    render(<CardTitle data-testid="title">Title text</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Title text');
  });

  it('applies default CardTitle classes', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title).toHaveClass('font-semibold', 'leading-none');
  });
});

describe('CardDescription', () => {
  it('renders CardDescription component', () => {
    render(
      <CardDescription data-testid="description">
        Description text
      </CardDescription>
    );
    const description = screen.getByTestId('description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('Description text');
  });

  it('applies default CardDescription classes', () => {
    render(<CardDescription data-testid="description">Text</CardDescription>);
    const description = screen.getByTestId('description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('renders CardContent component', () => {
    render(<CardContent data-testid="content">Content text</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Content text');
  });

  it('applies default CardContent classes', () => {
    render(<CardContent data-testid="content">Text</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('p-6', 'pt-0');
  });
});

describe('CardFooter', () => {
  it('renders CardFooter component', () => {
    render(<CardFooter data-testid="footer">Footer text</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer text');
  });

  it('applies default CardFooter classes', () => {
    render(<CardFooter data-testid="footer">Text</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex', 'items-center', 'p-6');
  });
});

describe('Card - Full Structure', () => {
  it('renders complete card structure', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
});

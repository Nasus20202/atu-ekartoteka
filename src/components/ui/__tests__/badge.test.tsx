import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders its text with the default variant', () => {
    render(<Badge>Opublikowana</Badge>);

    expect(screen.getByText('Opublikowana')).toHaveClass(
      'rounded-full',
      'bg-primary'
    );
  });

  it('applies the outline and secondary variants', () => {
    render(
      <>
        <Badge variant="outline">Obrys</Badge>
        <Badge variant="secondary">Drugi</Badge>
      </>
    );

    expect(screen.getByText('Obrys')).toHaveClass('text-foreground');
    expect(screen.getByText('Drugi')).toHaveClass('bg-secondary');
  });

  it('merges a custom class', () => {
    render(<Badge className="ml-2">Etykieta</Badge>);

    expect(screen.getByText('Etykieta')).toHaveClass('ml-2');
  });
});

import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

describe('Collapsible', () => {
  it('renders children', () => {
    render(<Collapsible>Test collapsible</Collapsible>);
    expect(screen.getByText('Test collapsible')).toBeInTheDocument();
  });

  it('accepts open prop', () => {
    render(<Collapsible open>Test</Collapsible>);
    // Since it's a primitive, we trust Radix handles the prop
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

describe('CollapsibleTrigger', () => {
  it('renders children', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Trigger</CollapsibleTrigger>
      </Collapsible>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });
});

describe('CollapsibleContent', () => {
  it('renders children', () => {
    render(
      <Collapsible open>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

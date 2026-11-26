import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { THREE_HOAS } from '@/components/apartments/__tests__/hoa-reorder-fixtures';
import { HoaCardGrid } from '@/components/apartments/hoa-card-grid';
import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';

function cardProps(hoa: HoaListItemDto, editing = false) {
  return {
    hoa,
    editing,
    editingName: hoa.name,
    onEditingNameChange: vi.fn(),
    onStartEdit: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };
}

describe('HoaCardGrid', () => {
  it('gives every card a labelled grip when it is sortable', () => {
    render(
      <HoaCardGrid
        hoas={THREE_HOAS}
        sortable
        onReorder={vi.fn()}
        cardProps={(hoa) => cardProps(hoa)}
      />
    );

    for (const { name } of THREE_HOAS) {
      expect(
        screen.getByRole('button', { name: `Przenieś wspólnotę ${name}` })
      ).toBeInTheDocument();
    }
  });

  it('describes the keyboard controls for the grips', () => {
    render(
      <HoaCardGrid
        hoas={THREE_HOAS}
        sortable
        onReorder={vi.fn()}
        cardProps={(hoa) => cardProps(hoa)}
      />
    );

    const grip = screen.getByRole('button', {
      name: 'Przenieś wspólnotę Alfa',
    });
    expect(
      document.getElementById(grip.getAttribute('aria-describedby')!)
    ).toHaveTextContent(/Aby przenieść wspólnotę/);
  });

  it('shows plain cards without grips when it is not sortable', () => {
    render(
      <HoaCardGrid
        hoas={THREE_HOAS}
        sortable={false}
        onReorder={vi.fn()}
        cardProps={(hoa) => cardProps(hoa)}
      />
    );

    expect(screen.getAllByText('Zobacz mieszkania')).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: /^Przenieś wspólnotę/ })
    ).toBeNull();
  });

  it('hides the grip of the card being renamed', () => {
    render(
      <HoaCardGrid
        hoas={THREE_HOAS}
        sortable
        onReorder={vi.fn()}
        cardProps={(hoa) => cardProps(hoa, hoa.id === 'b')}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Przenieś wspólnotę Beta' })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Przenieś wspólnotę Alfa' })
    ).toBeInTheDocument();
  });
});

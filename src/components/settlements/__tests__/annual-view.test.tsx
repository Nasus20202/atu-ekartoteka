import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { annualItem } from '@/__tests__/helpers/settlement-pdf/annual-page';
import { annualDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { AnnualView } from '@/components/settlements/annual-view';

const BASES = [
  'Wyrównanie zaliczek CW',
  'Wyrównanie zaliczek ZW',
  'Opłata za miejsce parkingowe',
  'Utrzymanie dźwigu',
];

const settlement = annualDto({
  items: BASES.map((basis) => annualItem({ basis })),
  apartmentTotal: 'Nadpłata [lokal]: 128,00 zł.',
  ownerTotal: 'Nadpłata [Klient]: 128,00 zł.',
});

describe('AnnualView', () => {
  it('words the total with its year and counts the items', () => {
    render(<AnnualView settlement={settlement} />);
    const banner = screen.getByRole('region', {
      name: 'Suma rozliczenia rocznego',
    });

    expect(banner).toHaveTextContent('Suma: nadpłata za 2025 rok');
    expect(banner).toHaveTextContent('4 pozycje · 01.01 – 31.12.2025');
  });

  it('lists every item and a Suma row with the stored total', () => {
    render(<AnnualView settlement={settlement} />);
    const table = screen.getByRole('table', { name: 'Pozycje rozliczenia' });
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(BASES.length + 2);
    expect(rows[1]).toHaveTextContent('Ciepła woda');
    expect(rows[1]).toHaveTextContent('wg: Wyrównanie zaliczek CW');
    expect(rows[1]).toHaveTextContent('-800,00 zł');
    expect(rows[1]).toHaveTextContent('0,04001000,00 / 25 000,00');
    expect(rows[1]).toHaveTextContent('32,00 złnadpłata');
    expect(rows[3]).toHaveTextContent('Miejsce parkingowe');
    expect(rows.at(-1)).toHaveTextContent('Suma128,00 złnadpłata');
  });

  it('keeps the printed title and period of an item readable', () => {
    render(<AnnualView settlement={settlement} />);

    expect(
      screen.getAllByText(
        /ROZLICZENIE KOSZTÓW CW ZA ROK 2025 - CIEPŁA WODA · 01\.01 – 31\.12\.2025/
      )
    ).toHaveLength(BASES.length);
    expect(screen.getByLabelText('Dane dokumentu')).toHaveTextContent(
      'roczne.pdf'
    );
    expect(screen.getByText(/wartość dodatnia oznacza/)).toBeInTheDocument();
  });

  it('does not repeat a title that is the item name', () => {
    const [item] = settlement.items;

    render(
      <AnnualView
        settlement={{ ...settlement, items: [{ ...item, name: item.title }] }}
      />
    );

    expect(screen.getByText('01.01 – 31.12.2025')).toBeInTheDocument();
  });
});

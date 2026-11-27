import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { utilityDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { FIXTURE_SERVICES } from '@/__tests__/helpers/settlement-pdf/utility-page';
import { UtilityView } from '@/components/settlements/utility-view';

const [advance, consumption] = FIXTURE_SERVICES;

describe('UtilityView', () => {
  it('words the result and shows the sums', () => {
    render(<UtilityView settlement={utilityDto()} />);
    const banner = screen.getByRole('region', {
      name: 'Wynik rozliczenia mediów',
    });

    expect(banner).toHaveTextContent('Nadpłata za media');
    expect(banner).toHaveTextContent('150,40 zł');
    expect(banner).toHaveTextContent('Suma zaliczek480,00 zł');
    expect(banner).toHaveTextContent('Koszt zużycia329,60 zł');
  });

  it('words an amount to pay as niedopłata', () => {
    render(
      <UtilityView
        settlement={utilityDto({ total: 'Do zapłaty [lokal]: 28,80' })}
      />
    );

    expect(screen.getByText('Niedopłata za media')).toBeInTheDocument();
  });

  it('shows a card per utility with its meter and usage', () => {
    render(<UtilityView settlement={utilityDto()} />);
    const card = screen.getByRole('region', { name: 'Ciepła woda (CW)' });

    expect(card).toHaveTextContent(
      'Licznik nr 7000001, odczyty: 105,500 → 115,800 m³'
    );
    expect(card).toHaveTextContent('Zużycie 10,300 m³');
    expect(card).toHaveTextContent('zaliczka 15,000 m³');
    expect(
      within(card).getByRole('img', {
        name: 'Wykorzystano 69 procent zaliczki',
      })
    ).toBeInTheDocument();
    expect(card).toHaveTextContent('150,40 złnadpłata');
  });

  it('lists both lines of a price change when expanded', async () => {
    render(
      <UtilityView
        settlement={utilityDto({
          services: [
            {
              ...advance,
              lines: [
                '01/05/2022 30/06/2022 6,000000 30,00 180,00',
                '01/07/2022 30/09/2022 9,000000 32,00 288,00',
              ],
            },
            consumption,
          ],
        })}
      />
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Szczegóły' }));

    const table = screen.getByRole('table', {
      name: 'Szczegóły: Ciepła woda (CW)',
    });
    const rows = within(table).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zaliczka CW01.05 – 30.06.2022');
    expect(rows[1]).toHaveTextContent('30,00 zł');
    expect(rows[2]).toHaveTextContent('01.07 – 30.09.2022');
    expect(rows[2]).toHaveTextContent('32,00 zł');
    expect(rows[3]).toHaveTextContent('Wyrównanie zaliczek CW (zużycie)');
    expect(rows[4]).toHaveTextContent('Do rozliczenia-4,700 m³-150,40 zł');
  });

  it('names an unknown code by the code and keeps other lines apart', () => {
    render(
      <UtilityView
        settlement={utilityDto({
          services: [
            { ...advance, name: 'Zaliczka PR' },
            { ...advance, name: 'Opłata abonamentowa' },
          ],
          meters: [],
          summaries: ['PR: 0,000000 - 15,000000 = -15,000000 -480,00'],
        })}
      />
    );

    const card = screen.getByRole('region', { name: 'PR' });
    expect(card).toHaveTextContent('Brak odczytu licznika');
    expect(screen.getByRole('region', { name: 'Pozostałe' })).toHaveTextContent(
      'Opłata abonamentowa'
    );
  });

  it('keeps a meter without a utility under Pozostałe', () => {
    render(
      <UtilityView
        settlement={utilityDto({
          meters: [
            'XY 01 9000009 (XY 1) 30/04/2022 1,000 30/09/2022 2,000 1,000 m3',
          ],
        })}
      />
    );

    expect(screen.getByRole('region', { name: 'Pozostałe' })).toHaveTextContent(
      'Licznik nr 9000009'
    );
  });

  it('shows the details of the document', () => {
    render(<UtilityView settlement={utilityDto()} />);
    const details = screen.getByLabelText('Dane dokumentu');

    expect(details).toHaveTextContent('Data wystawienia03.10.2022');
    expect(details).toHaveTextContent('Właściciel w dokumencieKowalska Anna');
    expect(details).toHaveTextContent('Plik źródłowymedia.pdf');
  });

  it('shows no document details when the reader gets none', () => {
    render(<UtilityView settlement={{ ...utilityDto(), origin: null }} />);

    expect(screen.queryByLabelText('Dane dokumentu')).not.toBeInTheDocument();
  });
});

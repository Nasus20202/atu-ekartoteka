import { describe, expect, it } from 'vitest';

import {
  annualItem,
  annualPage,
} from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  type FixturePage,
  fixtureRows,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';
import { parseAnnualRows } from '@/lib/settlements/parsers/parse-annual-rows';

// The reader drops the small legend before the rows reach the parser
const parse = (...pages: FixturePage[]) =>
  parseAnnualRows(
    fixtureRows(pages.map((page) => page.filter((r) => r.size !== 7)))
  );

const parking = annualItem({
  title: 'ROZLICZENIE KOSZTÓW MIEJSCA PARKINGOWEGO ZA ROK 2025',
  communityAmount: '1000,00',
  flatBasis: '480',
  coefficient: '0,0500',
  communityBasis: '9600',
  basis: 'Opłata za miejsce parkingowe',
  result: 'Do zapłaty [naliczenie]: 50,00 zł.',
});

describe('parseAnnualRows', () => {
  it('stores an item with its printed values', () => {
    const { records, ownerTotals, problems } = parse(annualPage());

    expect(problems).toEqual([]);
    expect(records[0]).toMatchObject({
      printedOwner: 'Kowalska Anna',
      apartmentLabel: 'Lipowa 5 / 1',
      address: { street: 'Lipowa', building: '5', number: '1' },
      periodFrom: '2025-01-01',
      periodTo: '2025-12-31',
      issuedOn: '2026-01-29',
    });
    const [item] = records[0].items;
    expect(item.title).toBe('ROZLICZENIE KOSZTÓW CW ZA ROK 2025 - CIEPŁA WODA');
    expect(item.basisDescription).toBe('Wyrównanie zaliczek CW');
    expect(
      [
        item.communityAmount,
        item.flatBasis,
        item.communityBasis,
        item.coefficient,
        item.amount,
      ].map(String)
    ).toEqual(['-800', '1000', '25000', '0.04', '-32']);
    expect(ownerTotals[0].apartmentSum.toString()).toBe('-32');
  });

  it('reads a building number with a letter', () => {
    const { records } = parse(annualPage({ apartment: 'Lipowa 22 B / 15' }));

    expect(records[0].address).toEqual({
      street: 'Lipowa',
      building: '22 B',
      number: '15',
    });
  });

  it('keeps items that continue on the next page', () => {
    const first = annualPage().slice(0, -3);
    const second = [
      ...parking,
      row('Do zapłaty [lokal]: 18,00 zł.'),
      row('Do zapłaty [Klient]: 18,00 zł.'),
    ];

    const { records, problems } = parse(first, second);

    expect(problems).toEqual([]);
    expect(records).toHaveLength(1);
    expect(records[0].items.map((i) => i.page)).toEqual([1, 2]);
    expect(records[0].totalAmount.toString()).toBe('18');
  });

  it('takes the period from the item dates', () => {
    const period: [string, string] = ['01/01/2025', '28/02/2025'];

    const { records } = parse(annualPage({ items: [annualItem({ period })] }));

    expect(records[0]).toMatchObject({
      periodFrom: '2025-01-01',
      periodTo: '2025-02-28',
    });
  });

  it('reads several apartments of one owner', () => {
    const page = annualPage();
    page.splice(
      -2,
      0,
      row('Lokal: Lipowa 5 / P1'),
      ...parking,
      row('Do zapłaty [lokal]: 50,00 zł.')
    );
    page[page.length - 2] = row('Do zapłaty [Klient]: 18,00 zł.');

    const { records, ownerTotals, problems } = parse(page);

    expect(problems).toEqual([]);
    expect(records.map((r) => r.apartmentLabel)).toEqual([
      'Lipowa 5 / 1',
      'Lipowa 5 / P1',
    ]);
    expect(records[1].printedOwner).toBe('Kowalska Anna');
    expect(ownerTotals).toHaveLength(1);
    expect(ownerTotals[0].apartmentSum.toString()).toBe('18');
  });

  it('keeps each owner apart', () => {
    const { records } = parse(annualPage(), annualPage({ owner: 'Nowak Jan' }));

    expect(records.map((r) => r.printedOwner)).toEqual([
      'Kowalska Anna',
      'Nowak Jan',
    ]);
  });

  it.each([
    ['an unknown row', 'Opłata dodatkowa 1,00'],
    ['a repeated part', 'Współczynnik ustalony wg: CO opłata stała'],
  ])('rejects %s inside an item', (_, text) => {
    const page = annualPage();
    page.splice(-3, 0, row(text));

    expect(parse(page).problems[0]).toMatchObject({
      kind: 'unrecognised',
      page: 1,
      message: `Nierozpoznany wiersz: „${text}”`,
    });
  });

  it('rejects an item with a missing part', () => {
    const items = [annualItem().filter((r) => !r.text.startsWith('Za okres'))];

    expect(parse(annualPage({ items })).problems).not.toEqual([]);
  });

  it('rejects an apartment without a readable owner', () => {
    const page = annualPage().filter((r) => !r.text.startsWith('ul. '));

    expect(parse(page).problems[0].message).toContain(
      'Nie można odczytać lokalu lub właściciela'
    );
  });

  it('rejects an unreadable apartment', () => {
    expect(
      parse(annualPage({ apartment: 'garaż' })).problems[0].message
    ).toContain('Nie można odczytać lokalu');
  });

  it('rejects a missing owner total', () => {
    const page = annualPage().slice(0, -2);

    expect(parse(page).problems.at(-1)?.message).toContain(
      'Brak sumy rozliczenia'
    );
  });

  it('does not give the next owner to an apartment without an owner total', () => {
    const { problems } = parse(
      annualPage().slice(0, -2),
      annualPage({ owner: 'Nowak Jan' })
    );

    expect(problems).not.toEqual([]);
  });

  it('rejects results that stand outside any record', () => {
    const { problems } = parse(annualPage(), [
      row('Do zapłaty [naliczenie]: 1,00 zł.'),
    ]);

    expect(problems[0].message).toContain('Pozycja poza rozliczeniem');
  });
});

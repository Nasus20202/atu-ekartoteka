import {
  FIXTURE_RECIPIENT_X,
  type FixturePage,
  type FixtureRow,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';

export interface FixtureAnnualItem {
  title?: string;
  communityAmount?: string;
  period?: [string, string];
  flatBasis?: string;
  coefficient?: string;
  communityBasis?: string;
  basis?: string;
  result?: string;
}

/** An item whose amount follows from the formula. */
export function annualItem({
  title = 'ROZLICZENIE KOSZTÓW CW ZA ROK 2025 - CIEPŁA WODA',
  communityAmount = '-800,00',
  period = ['01/01/2025', '31/12/2025'],
  flatBasis = '1000,00',
  coefficient = '0,0400',
  communityBasis = '25000,00',
  basis = 'Wyrównanie zaliczek CW',
  result = 'Nadpłata [naliczenie]: 32,00 zł.',
}: FixtureAnnualItem = {}): FixtureRow[] {
  return [
    row('Rozliczenie kwoty proporcjonalnie', FIXTURE_RECIPIENT_X),
    row(`Tytułem: ${title}`),
    row('* wartość dodatnia = niedopłata,', 408, 7),
    row(`Kwota do rozliczenia:* ${communityAmount} zł.`),
    row(`Za okres od: ${period[0]} do:${period[1]}`),
    row(flatBasis, 303),
    row(`Współczynnik dla lokalu: ${coefficient}`),
    row(communityBasis, 303),
    row(`Współczynnik ustalony wg: ${basis}`),
    row(result),
  ];
}

export const annualHeader = ({
  issued = '29/01/2026',
  owner = 'Kowalska Anna',
} = {}): FixtureRow[] => [
  row(`Gdańsk , dn. ${issued}`, 400),
  row('Wspólnota Mieszkaniowa Testowa', 30),
  row(owner, FIXTURE_RECIPIENT_X),
  row('ul. Lipowa 5 / 01 , Gdańsk', FIXTURE_RECIPIENT_X),
];

export interface FixtureAnnualPage {
  issued?: string;
  owner?: string;
  apartment?: string;
  items?: FixtureRow[][];
  apartmentTotal?: string;
  ownerTotal?: string;
}

/** A page of a fictional annual settlement of one owner, without a title. */
export function annualPage({
  issued,
  owner,
  apartment = 'Lipowa 5 / 1',
  items = [annualItem()],
  apartmentTotal = 'Nadpłata [lokal]: 32,00 zł.',
  ownerTotal = 'Nadpłata [Klient]: 32,00 zł.',
}: FixtureAnnualPage = {}): FixturePage {
  return [
    ...annualHeader({ issued, owner }),
    row(`Lokal: ${apartment}`),
    ...items.flat(),
    row(apartmentTotal),
    row(ownerTotal),
    row('KWOTĘ Z ROZLICZENIA PROSZĘ ODJĄĆ OD OPŁAT.'),
  ];
}

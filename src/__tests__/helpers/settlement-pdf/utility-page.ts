import {
  type FixturePage,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';

export interface FixtureService {
  name: string;
  column: 'Zaliczka' | 'Do zapłaty' | (string & {});
  lines: string[];
}

export interface FixtureUtilityPage {
  issued?: string;
  owner?: string;
  apartmentId?: string;
  services?: FixtureService[];
  meters?: string[];
  period?: [string, string];
  summaries?: string[];
  total?: string;
}

const PERIOD: [string, string] = ['01/05/2022', '30/09/2022'];

export const FIXTURE_SERVICES: FixtureService[] = [
  {
    name: 'Zaliczka CW',
    column: 'Zaliczka',
    lines: ['01/05/2022 30/09/2022 15,000000 32,00 480,00'],
  },
  {
    name: 'Wyrównanie zaliczek CW',
    column: 'Do zapłaty',
    lines: ['01/05/2022 30/09/2022 10,300000 32,00 329,60'],
  },
];

/** A page of a fictional utility settlement that adds up. */
export function utilityPage({
  issued = '03/10/2022',
  owner = 'Kowalska Anna',
  apartmentId = 'TST01-TST01-00000-00001M',
  services = FIXTURE_SERVICES,
  meters = [
    'CW 01 7000001 (CW 1) 30/04/2022 105,500 30/09/2022 115,800 10,300 m3',
  ],
  period = PERIOD,
  summaries = ['CW: 10,300000 - 15,000000 = -4,700000 -150,40'],
  total = 'Nadpłata [lokal]: 150,40',
}: FixtureUtilityPage = {}): FixturePage {
  return [
    row(`Gdańsk , dn. ${issued}`, 400),
    row('Wspólnota Mieszkaniowa Testowa'),
    row('Rozliczenie zaliczek za media', 180),
    row(`Klient: ${owner}`),
    row(`Lokal: ${apartmentId} Nazwa:Lipowa 5 / 1`),
    ...services.flatMap(({ name, column, lines }) => [
      row(`Usługa:${name}`),
      row(`Okres od Okres do Ilość Cena ${column}`),
      ...lines.map((line) => row(line)),
    ]),
    row('URZĄDZENIE TYP DATA POCZ. STAN POCZ. DATA KOŃ. STAN KOŃ. ZUŻYCIE'),
    ...meters.map((meter) => row(meter)),
    row(
      `${period[0]} ${period[1]} Zużycie Suma zaliczek Do rozliczenia Do zapłaty [zł] *`
    ),
    ...summaries.map((summary) => row(summary)),
    row(total),
    row('UWAGA: kwotę nadpłaty prosimy odjąć od opłat.'),
  ];
}

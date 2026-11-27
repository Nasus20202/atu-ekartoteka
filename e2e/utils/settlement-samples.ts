/** Fictional settlements of one year that add up, for seeding the database. */

import { annualItem } from '../../src/__tests__/helpers/settlement-pdf/annual-page';
import {
  parsedAnnualRecord,
  parsedUtilityRecord,
} from '../../src/__tests__/helpers/settlement-pdf/parsed-records';
import {
  annualData,
  utilityData,
} from '../../src/lib/settlements/mutations/settlement-data';

export const SAMPLE_OWNER = 'Kowalska Anna';

const meter = (
  device: string,
  serial: string,
  label: string,
  year: number,
  [start, end, used]: string[]
) =>
  `${device} ${serial} (${label}) 30/04/${year} ${start} 30/09/${year} ${end} ${used} m3`;

export function utilitySample(year: number) {
  const whole = `01/05/${year} 30/09/${year}`;
  const record = parsedUtilityRecord({
    issued: `03/10/${year}`,
    owner: SAMPLE_OWNER,
    period: [`01/05/${year}`, `30/09/${year}`],
    services: [
      {
        name: 'Zaliczka CW',
        column: 'Zaliczka',
        lines: [
          `01/05/${year} 30/06/${year} 8,000000 30,00 240,00`,
          `01/07/${year} 30/09/${year} 12,000000 32,00 384,00`,
        ],
      },
      {
        name: 'Wyrównanie zaliczek CW',
        column: 'Do zapłaty',
        lines: [`${whole} 14,200000 32,00 454,40`],
      },
      {
        name: 'Zaliczka ZW',
        column: 'Zaliczka',
        lines: [`${whole} 25,000000 12,00 300,00`],
      },
      {
        name: 'Wyrównanie zaliczek ZW',
        column: 'Do zapłaty',
        lines: [`${whole} 27,400000 12,00 328,80`],
      },
      {
        name: 'Zaliczka CO (m3)',
        column: 'Zaliczka',
        lines: [`${whole} 30,000000 6,00 180,00`],
      },
      {
        name: 'Wyrównanie zaliczki CO',
        column: 'Do zapłaty',
        lines: [`${whole} 5,500000 6,00 33,00`],
      },
    ],
    meters: [
      meter('CO 01', '1000101', 'CO mieszkania', year, [
        '850,300',
        '855,800',
        '5,500',
      ]),
      meter('CW 01', '1000102', 'Ciepła woda', year, [
        '120,400',
        '134,600',
        '14,200',
      ]),
      meter('ZW 01', '1000103', 'Zimna woda', year, [
        '210,150',
        '237,550',
        '27,400',
      ]),
    ],
    summaries: [
      'CW: 14,200000 - 20,000000 = -5,800000 -169,60',
      'ZW: 27,400000 - 25,000000 = 2,400000 28,80',
      'CO: 5,500000 - 30,000000 = -24,500000 -147,00',
    ],
    total: 'Nadpłata [lokal]: 287,80',
  });

  return utilityData(record, `media-${year}.pdf`);
}

export function annualSample(year: number) {
  const period: [string, string] = [`01/01/${year}`, `31/12/${year}`];
  const items = [
    ['Wyrównanie zaliczek CW', '-1000,00', '3600,00', '0,1000', '36000,00'],
    ['Wyrównanie zaliczki CO (m3)', '-800,00', '2400,00', '0,0750', '32000,00'],
    ['Opłata za miejsce parkingowe', '-400,00', '300,00', '0,1000', '3000,00'],
    ['Utrzymanie dźwigu', '120,00', '120,00', '0,0500', '2400,00'],
  ].map(([basis, communityAmount, flatBasis, coefficient, communityBasis]) => ({
    basis,
    communityAmount,
    flatBasis,
    coefficient,
    communityBasis,
  }));
  const results = [
    'Nadpłata [naliczenie]: 100,00 zł.',
    'Nadpłata [naliczenie]: 60,00 zł.',
    'Nadpłata [naliczenie]: 40,00 zł.',
    'Niedopłata [naliczenie]: 6,00 zł.',
  ];
  const record = parsedAnnualRecord({
    issued: `29/01/${year + 1}`,
    owner: SAMPLE_OWNER,
    items: items.map((item, index) =>
      annualItem({
        ...item,
        period,
        result: results[index],
        title: `ROZLICZENIE KOSZTÓW ZA ROK ${year} - ${item.basis.toUpperCase()}`,
      })
    ),
    apartmentTotal: 'Nadpłata [lokal]: 194,00 zł.',
    ownerTotal: 'Nadpłata [Klient]: 194,00 zł.',
  });

  if (record.items.length !== items.length) {
    throw new Error('Sample annual settlement did not parse');
  }
  return annualData(record, `koszty-${year}.pdf`);
}

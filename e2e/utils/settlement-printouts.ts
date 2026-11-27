/**
 * Generated sample printouts of a fictional apartment, and the charges that
 * agree with them.
 */

import {
  annualItem,
  annualPage,
} from '../../src/__tests__/helpers/settlement-pdf/annual-page';
import type { FixturePage } from '../../src/__tests__/helpers/settlement-pdf/fixture-page';
import { utilityPage } from '../../src/__tests__/helpers/settlement-pdf/utility-page';
import type { ChargeSeed, ImportApartment } from './settlement-import-hoa';

/** Within the default history window of a tenant. */
export const PRINTOUT_YEAR = new Date().getFullYear() - 1;

const MONTHS = ['05', '06', '07', '08', '09'];
const PRICE = 32;

export interface UtilityPrintout {
  /** Printed name, the apartment's owner by default */
  owner?: string;
  /** First and last day of the period as DD/MM */
  period?: [string, string];
  /** Day of the first reading as DD/MM */
  readFrom?: string;
  /** First reading, last reading and the consumption between them */
  readings?: [string, string, string];
}

/** A utility settlement of hot water that adds up. */
export function utilityPrintout(
  { externalApartmentId, meterSerial, owner: recorded }: ImportApartment,
  {
    owner = recorded,
    period = ['01/05', '30/09'],
    readFrom = '30/04',
    readings = ['105,500', '115,800', '10,300'],
  }: UtilityPrintout = {}
): FixturePage {
  const [from, to] = period.map((day) => `${day}/${PRINTOUT_YEAR}`);
  const [start, end, used] = readings;

  return utilityPage({
    issued: `20/12/${PRINTOUT_YEAR}`,
    owner,
    apartmentId: externalApartmentId,
    period: [from, to],
    services: [
      {
        name: 'Zaliczka CW',
        column: 'Zaliczka',
        lines: [`${from} ${to} 15,000000 32,00 480,00`],
      },
      {
        name: 'Wyrównanie zaliczek CW',
        column: 'Do zapłaty',
        lines: [`${from} ${to} 10,300000 32,00 329,60`],
      },
    ],
    meters: [
      `CW 01 ${meterSerial} (CW 1) ${readFrom}/${PRINTOUT_YEAR} ${start} ${to} ${end} ${used} m3`,
    ],
  });
}

/** Charges of May to September; the defaults agree with `utilityPrintout`. */
export function utilityCharges(advancePerMonth = 3): ChargeSeed[] {
  return [
    ...MONTHS.map((month) => ({
      period: `${PRINTOUT_YEAR}${month}`,
      description: 'Zaliczka CW',
      quantity: advancePerMonth,
      unitPrice: PRICE,
      amount: advancePerMonth * PRICE,
    })),
    {
      period: `${PRINTOUT_YEAR}09`,
      description: 'Wyrównanie zaliczek CW',
      quantity: -4.7,
      unitPrice: PRICE,
      amount: -150.4,
    },
  ];
}

export const annualPeriod: [string, string] = [
  `01/01/${PRINTOUT_YEAR}`,
  `31/12/${PRINTOUT_YEAR}`,
];

/** The printed address by which an annual record finds its apartment. */
export const printedAddress = ({ number }: ImportApartment) =>
  `ul. Testowa 1 / ${number}`;

export const hotWaterItem = () =>
  annualItem({
    period: annualPeriod,
    title: `ROZLICZENIE KOSZTÓW CW ZA ROK ${PRINTOUT_YEAR} - CIEPŁA WODA`,
  });

/** An annual settlement with one item: 32 zł overpaid for hot water. */
export function annualPrintout(apartment: ImportApartment): FixturePage {
  return annualPage({
    issued: `29/01/${PRINTOUT_YEAR + 1}`,
    owner: apartment.owner,
    apartment: printedAddress(apartment),
    items: [hotWaterItem()],
  });
}

/** The flat basis as an advance, and the December allocation of the result. */
export function annualCharges(advance = 1000): ChargeSeed[] {
  return [
    {
      period: `${PRINTOUT_YEAR}06`,
      description: 'Zaliczka CW',
      quantity: 1,
      unitPrice: advance,
      amount: advance,
    },
    {
      period: `${PRINTOUT_YEAR}12`,
      description: 'Wyrównanie zaliczek CW',
      quantity: -32,
      unitPrice: 1,
      amount: -32,
    },
  ];
}

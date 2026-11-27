import { fixtureRows } from '@/__tests__/helpers/settlement-pdf/fixture-page';
import { UTILITY_PAGE_CHARGES } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import {
  type FixtureUtilityPage,
  utilityPage,
} from '@/__tests__/helpers/settlement-pdf/utility-page';
import { parseUtilityRows } from '@/lib/settlements/parsers/parse-utility-rows';
import type { ApartmentCandidate } from '@/lib/settlements/types/stored-data';

export const FIXTURE_APARTMENT: ApartmentCandidate = {
  id: 'apartment-1',
  externalApartmentId: 'TST01-TST01-00000-00001M',
  homeownersAssociationId: 'hoa-1',
  owner: 'Kowalska Anna',
  address: 'ul. Lipowa',
  building: '5',
  number: '1',
  validFrom: null,
  validTo: null,
};

export const FIXTURE_CHARGES = UTILITY_PAGE_CHARGES;

/** What the reader returns for a generated utility printout. */
export const utilityDocument = (...pages: FixtureUtilityPage[]) =>
  parseUtilityRows(fixtureRows((pages.length ? pages : [{}]).map(utilityPage)));

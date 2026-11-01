import { describe, expect, it } from 'vitest';

import {
  APP_NAME,
  formatAdminApartmentTitle,
  formatChargesTitle,
  formatDocumentTitle,
  formatPaymentsYearTitle,
  nestedTitle,
  PAGE_TITLE_TEMPLATE,
} from '@/lib/metadata/document-title';

describe('document title', () => {
  it('keeps the template for nested segments', () => {
    expect(nestedTitle('Użytkownicy')).toEqual({
      default: 'Użytkownicy',
      template: PAGE_TITLE_TEMPLATE,
    });
  });

  it('appends the app name to a page title', () => {
    expect(formatDocumentTitle('Logowanie')).toBe(`Logowanie | ${APP_NAME}`);
  });

  it('fills the metadata template with the page title', () => {
    expect(PAGE_TITLE_TEMPLATE.replace('%s', 'Profil')).toBe(
      `Profil | ${APP_NAME}`
    );
  });
});

describe('charges title', () => {
  it('includes the address label for the owner', () => {
    expect(formatChargesTitle('Mickiewicza 3/12')).toBe(
      'Naliczenia - Mickiewicza 3/12'
    );
  });

  it('uses the generic title without a label', () => {
    expect(formatChargesTitle(null)).toBe('Naliczenia mieszkania');
  });
});

describe('payments year title', () => {
  it('includes the year and the address label for the owner', () => {
    expect(formatPaymentsYearTitle(2025, 'Mickiewicza 3/12')).toBe(
      'Wpłaty 2025 - Mickiewicza 3/12'
    );
  });

  it('uses the generic title for an invalid year', () => {
    expect(formatPaymentsYearTitle(null, 'Mickiewicza 3/12')).toBe(
      'Wpłaty mieszkania'
    );
  });

  it('uses the generic title without a label', () => {
    expect(formatPaymentsYearTitle(2025, null)).toBe('Wpłaty mieszkania');
  });
});

describe('admin apartment title', () => {
  it('includes the apartment number and the HOA name', () => {
    expect(formatAdminApartmentTitle('12', 'KLO11')).toBe('Lokal 12 - KLO11');
  });
});

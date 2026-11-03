import { describe, expect, it } from 'vitest';

import {
  APP_NAME,
  formatDocumentTitle,
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

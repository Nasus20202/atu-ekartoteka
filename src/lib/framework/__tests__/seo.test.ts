import { describe, expect, it } from 'vitest';

import {
  PUBLIC_PAGES,
  publicPageMetadata,
  ROOT_METADATA,
  SITE_DESCRIPTION,
} from '@/lib/framework/seo';
import {
  APP_NAME,
  formatDocumentTitle,
  PAGE_TITLES,
} from '@/lib/shared/document-title';

const pages = Object.values(PUBLIC_PAGES);

describe('PUBLIC_PAGES', () => {
  it('lists the four pages a visitor can open without an account', () => {
    expect(pages.map((page) => page.path)).toEqual([
      '/login',
      '/register',
      '/forgot-password',
      '/privacy',
    ]);
  });

  it('uses the page titles from the shared title list', () => {
    expect(PUBLIC_PAGES.login.title).toBe(PAGE_TITLES.login);
    expect(PUBLIC_PAGES.register.title).toBe(PAGE_TITLES.register);
    expect(PUBLIC_PAGES.forgotPassword.title).toBe(PAGE_TITLES.forgotPassword);
    expect(PUBLIC_PAGES.privacy.title).toBe(PAGE_TITLES.privacy);
  });

  it('gives every page a different description', () => {
    const descriptions = new Set(pages.map((page) => page.description));

    expect(descriptions.size).toBe(pages.length);
  });
});

describe('ROOT_METADATA', () => {
  it('keeps every page out of the index by default', () => {
    expect(ROOT_METADATA.robots).toEqual({ index: false, follow: false });
  });

  it('keeps the app title and the site description', () => {
    expect(ROOT_METADATA.title).toEqual({
      template: `%s | ${APP_NAME}`,
      default: APP_NAME,
    });
    expect(ROOT_METADATA.description).toBe(SITE_DESCRIPTION);
  });
});

describe('publicPageMetadata', () => {
  it.each(pages)(
    'makes $path indexable with its own canonical URL',
    ({ path, title, description }) => {
      const metadata = publicPageMetadata({ path, title, description });

      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(description);
      expect(metadata.alternates).toEqual({ canonical: path });
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  );

  it.each(pages)(
    'gives $path an Open Graph preview',
    ({ path, title, description }) => {
      const metadata = publicPageMetadata({ path, title, description });

      expect(metadata.openGraph).toEqual({
        type: 'website',
        siteName: APP_NAME,
        locale: 'pl_PL',
        title: formatDocumentTitle(title),
        description,
      });
      expect(metadata.twitter).toEqual({
        card: 'summary',
        title: formatDocumentTitle(title),
        description,
      });
    }
  );

  it('leaves out URLs that would need the deployment host', () => {
    for (const page of pages) {
      const metadata = publicPageMetadata(page);

      expect(metadata.metadataBase).toBeUndefined();
      expect(metadata.openGraph).not.toHaveProperty('url');
      expect(metadata.openGraph).not.toHaveProperty('images');
      expect(metadata.twitter).not.toHaveProperty('images');
    }
  });
});

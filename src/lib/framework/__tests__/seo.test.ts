import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getRobots,
  getRootMetadata,
  getSitemap,
  PUBLIC_PAGES,
  publicPageMetadata,
} from '@/lib/framework/seo';

const mocks = vi.hoisted(() => ({ connection: vi.fn() }));

vi.mock('next/server', () => ({ connection: mocks.connection }));

const APP_URL = 'https://ekartoteka.example.com';

describe('publicPageMetadata', () => {
  it('marks the page indexable with its own canonical path', () => {
    const metadata = publicPageMetadata(PUBLIC_PAGES.login);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: '/login' });
  });

  it('gives previews the full title and the large card format', () => {
    const metadata = publicPageMetadata(PUBLIC_PAGES.login);

    expect(metadata.openGraph).toMatchObject({
      title: 'Logowanie | ATU Ekartoteka',
      url: '/login',
      images: ['/opengraph-image'],
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Logowanie | ATU Ekartoteka',
      images: ['/opengraph-image'],
    });
  });
});

describe('site metadata and crawler files', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', APP_URL);
    mocks.connection.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves metadataBase from APP_URL at request time', async () => {
    const metadata = await getRootMetadata();

    expect(metadata.metadataBase?.toString()).toBe(`${APP_URL}/`);
    expect(mocks.connection).toHaveBeenCalledOnce();
  });

  it('keeps every page out of search unless it opts in', async () => {
    const metadata = await getRootMetadata();

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('falls back to the local address when APP_URL is not set', async () => {
    vi.stubEnv('APP_URL', '');

    const metadata = await getRootMetadata();

    expect(metadata.metadataBase?.toString()).toBe('http://localhost:3000/');
  });

  it('keeps crawlers out of private sections and points to the sitemap', async () => {
    const robots = await getRobots();

    expect(robots).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/admin'],
      },
      sitemap: `${APP_URL}/sitemap.xml`,
    });
    expect(mocks.connection).toHaveBeenCalledOnce();
  });

  it('lists only the public pages as absolute URLs', async () => {
    const sitemap = await getSitemap();

    expect(sitemap).toEqual([
      { url: `${APP_URL}/login` },
      { url: `${APP_URL}/register` },
      { url: `${APP_URL}/forgot-password` },
      { url: `${APP_URL}/privacy` },
    ]);
  });
});

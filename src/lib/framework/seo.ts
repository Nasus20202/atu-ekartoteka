import type { Metadata } from 'next';

import {
  APP_NAME,
  formatDocumentTitle,
  PAGE_TITLE_TEMPLATE,
  PAGE_TITLES,
} from '@/lib/shared/document-title';

export const SITE_DESCRIPTION =
  'Ekartoteka ATU: naliczenia i wpłaty Twojego mieszkania w jednym miejscu.';

/** Social networks expect the language of the content, not the HTML one. */
const OG_LOCALE = 'pl_PL';
/** Without an image a large card renders worse than a plain summary. */
const TWITTER_CARD = 'summary';

interface PublicPage {
  path: string;
  title: string;
  description: string;
}

/**
 * Pages a signed-out visitor can open. Only these leave the index, and each
 * needs its own description because search engines show one result per URL.
 */
export const PUBLIC_PAGES = {
  login: {
    path: '/login',
    title: PAGE_TITLES.login,
    description:
      'Zaloguj się do ekartoteki ATU i sprawdź naliczenia oraz wpłaty swojego mieszkania.',
  },
  register: {
    path: '/register',
    title: PAGE_TITLES.register,
    description:
      'Załóż konto w ekartotece ATU, aby przeglądać naliczenia i wpłaty swojego mieszkania.',
  },
  forgotPassword: {
    path: '/forgot-password',
    title: PAGE_TITLES.forgotPassword,
    description: 'Odzyskaj dostęp do konta w ekartotece ATU.',
  },
  privacy: {
    path: '/privacy',
    title: PAGE_TITLES.privacy,
    description:
      'Polityka prywatności ekartoteki ATU: jakie dane przetwarzamy i w jakim celu.',
  },
} as const satisfies Record<string, PublicPage>;

/**
 * Site-wide defaults. Every page is kept out of the index unless it opts in
 * with `publicPageMetadata`, so a new page is private by default.
 */
export const ROOT_METADATA: Metadata = {
  title: { template: PAGE_TITLE_TEMPLATE, default: APP_NAME },
  applicationName: APP_NAME,
  description: SITE_DESCRIPTION,
  robots: { index: false, follow: false },
};

/**
 * Metadata of an indexable page: its own canonical path, description and
 * social preview. URLs stay relative because a prerendered page is built once
 * and served under whatever host the deployment uses.
 */
export function publicPageMetadata({
  path,
  title,
  description,
}: PublicPage): Metadata {
  const fullTitle = formatDocumentTitle(title);
  const openGraph: Metadata['openGraph'] = {
    type: 'website',
    siteName: APP_NAME,
    locale: OG_LOCALE,
    title: fullTitle,
    description,
  };
  const twitter: Metadata['twitter'] = {
    card: TWITTER_CARD,
    title: fullTitle,
    description,
  };

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph,
    twitter,
  };
}

import type { Metadata } from 'next';

import { nestedTitle, PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: nestedTitle(PAGE_TITLES.hoaList) };

export default function ApartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.apartment };

export default function ApartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

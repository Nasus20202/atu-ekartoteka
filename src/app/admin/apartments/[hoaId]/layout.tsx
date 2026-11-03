import type { Metadata } from 'next';

import { nestedTitle, PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = {
  title: nestedTitle(PAGE_TITLES.hoaApartmentsFallback),
};

export default function HoaApartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

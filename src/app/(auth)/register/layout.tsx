import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.register };

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

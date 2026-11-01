import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.importData };

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

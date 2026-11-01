import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.settings };

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

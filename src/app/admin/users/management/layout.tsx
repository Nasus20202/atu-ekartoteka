import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.accountManagement };

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from 'next';

import { nestedTitle, PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: nestedTitle(PAGE_TITLES.votings) };

export default function TenantVotingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

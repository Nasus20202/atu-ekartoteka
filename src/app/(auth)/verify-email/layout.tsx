import type { Metadata } from 'next';

import { PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.verifyEmail };

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

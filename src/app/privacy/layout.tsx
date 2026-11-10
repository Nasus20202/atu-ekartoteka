import type { Metadata } from 'next';

import { AppFooter } from '@/components/layout/app-footer';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.privacy };

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col">{children}</div>
      <AppFooter />
    </div>
  );
}

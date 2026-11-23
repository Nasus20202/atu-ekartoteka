import type { Metadata } from 'next';

import { AppFooter } from '@/components/layout/app-footer';
import { PUBLIC_PAGES, publicPageMetadata } from '@/lib/framework/seo';

export const metadata: Metadata = publicPageMetadata(PUBLIC_PAGES.privacy);

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

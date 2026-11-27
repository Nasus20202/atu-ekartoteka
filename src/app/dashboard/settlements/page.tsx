import type { Metadata } from 'next';

import { Page } from '@/components/layout/page';
import { SettlementsEntry } from '@/components/settlements/settlements-entry';
import { PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.settlements };

// No Suspense boundary on purpose: the redirect has to be decided before
// anything is sent. Behind a fallback the browser would load a skeleton, leave
// for the apartment's address and show a skeleton again.
export default function SettlementsPage() {
  return (
    <Page>
      <SettlementsEntry />
    </Page>
  );
}

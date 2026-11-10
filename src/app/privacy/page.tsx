import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PrivacyPolicySection } from '@/components/privacy/privacy-policy-section';
import { Skeleton } from '@/components/ui/skeleton';

function PolicyFallback() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Page maxWidth="4xl">
      <Suspense fallback={<PolicyFallback />}>
        <PrivacyPolicySection />
      </Suspense>
    </Page>
  );
}

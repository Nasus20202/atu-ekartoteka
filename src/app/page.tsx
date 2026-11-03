import { Suspense } from 'react';

import { RootRedirect } from '@/components/navigation/root-redirect';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  );
}

'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface PolicyToolbarProps {
  /** Printing makes sense only when there is a policy to print. */
  canPrint: boolean;
}

/** Back and print controls; both stay off the printed page. */
export function PolicyToolbar({ canPrint }: PolicyToolbarProps) {
  const router = useRouter();

  // Someone who opened the policy in a new tab has nothing to go back to
  const goBack = () =>
    window.history.length > 1 ? router.back() : router.push('/');

  return (
    <div className="mb-6 flex items-center justify-between gap-2 print:hidden">
      <Button type="button" variant="ghost" onClick={goBack}>
        <ArrowLeft aria-hidden="true" />
        Wróć
      </Button>
      {canPrint && (
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Drukuj lub zapisz jako PDF
        </Button>
      )}
    </div>
  );
}

'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Powrót
    </Button>
  );
}

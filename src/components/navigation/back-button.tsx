'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      className="h-12 w-12 transition-[width,height] duration-200 group-data-[stuck=true]/header:h-10 group-data-[stuck=true]/header:w-10 motion-reduce:transition-none [&_svg]:size-6!"
      aria-label="Wróć"
    >
      <ArrowLeft />
    </Button>
  );
}

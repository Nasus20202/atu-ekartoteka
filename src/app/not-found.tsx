import { FileQuestion } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.notFound };

export default function NotFound() {
  return (
    <StatusCard
      icon={FileQuestion}
      title="404"
      titleClassName="text-4xl sm:text-4xl"
      actions={
        <Button asChild>
          <Link href="/dashboard">Powrót do strony głównej</Link>
        </Button>
      }
    >
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Strona nie znaleziona
      </h2>
      <p>Strona, której szukasz, nie istnieje lub została przeniesiona.</p>
    </StatusCard>
  );
}

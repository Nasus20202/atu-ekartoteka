import { ReceiptText } from 'lucide-react';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <StatusCard
      icon={ReceiptText}
      title="Naliczenia nie znalezione"
      actions={
        <Button asChild>
          <Link href="/dashboard/charges">Powrót do naliczeń</Link>
        </Button>
      }
    >
      <p>
        Brak naliczeń dla tego mieszkania. Mieszkanie nie istnieje lub nie masz
        do niego dostępu.
      </p>
    </StatusCard>
  );
}

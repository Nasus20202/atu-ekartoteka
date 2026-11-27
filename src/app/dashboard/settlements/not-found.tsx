import { ReceiptText } from 'lucide-react';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <StatusCard
      icon={ReceiptText}
      title="Rozliczenie nie znalezione"
      actions={
        <Button asChild>
          <Link href="/dashboard/settlements">Powrót do rozliczeń</Link>
        </Button>
      }
    >
      <p>
        Nie ma takiego rozliczenia. Sprawdź adres lub upewnij się, że masz
        dostęp do lokalu.
      </p>
    </StatusCard>
  );
}

import { Wallet } from 'lucide-react';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <StatusCard
      icon={Wallet}
      title="Wpłaty nie znalezione"
      actions={
        <Button asChild>
          <Link href="/dashboard/payments">Powrót do wpłat</Link>
        </Button>
      }
    >
      <p>
        Brak wpłat dla tego mieszkania w wybranym roku. Sprawdź rok lub upewnij
        się, że masz dostęp do mieszkania.
      </p>
    </StatusCard>
  );
}

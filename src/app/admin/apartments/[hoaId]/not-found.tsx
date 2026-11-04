import { Building2 } from 'lucide-react';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <StatusCard
      icon={Building2}
      title="Wspólnota nie znaleziona"
      actions={
        <Button asChild>
          <Link href="/admin/apartments">Powrót do wspólnot</Link>
        </Button>
      }
    >
      <p>Ta wspólnota nie istnieje lub została usunięta.</p>
    </StatusCard>
  );
}

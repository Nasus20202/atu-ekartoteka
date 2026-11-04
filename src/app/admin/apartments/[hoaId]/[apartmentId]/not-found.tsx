import { Home } from 'lucide-react';
import Link from 'next/link';

import { StatusCard } from '@/components/errors/status-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <StatusCard
      icon={Home}
      title="Mieszkanie nie znalezione"
      actions={
        <Button asChild>
          <Link href="/admin/apartments">Powrót do mieszkań</Link>
        </Button>
      }
    >
      <p>To mieszkanie nie istnieje lub zostało usunięte.</p>
    </StatusCard>
  );
}

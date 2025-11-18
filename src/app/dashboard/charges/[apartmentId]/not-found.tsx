import { Building2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="mb-2 text-2xl font-bold">
              Mieszkanie nie znalezione
            </h1>
            <p className="mb-6 text-center text-muted-foreground">
              To mieszkanie nie istnieje lub nie masz do niego dostępu.
            </p>
            <Link href="/dashboard/charges">
              <Button>Powrót do naliczeń</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

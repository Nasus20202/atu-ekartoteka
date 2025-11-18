import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="mb-2 text-4xl font-bold">404</h1>
            <h2 className="mb-2 text-xl font-semibold">
              Strona nie znaleziona
            </h2>
            <p className="mb-6 text-center text-muted-foreground">
              Strona, której szukasz nie istnieje.
            </p>
            <Link href="/dashboard">
              <Button>Powrót do strony głównej</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

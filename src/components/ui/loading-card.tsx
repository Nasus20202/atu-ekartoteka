import { Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface LoadingCardProps {
  message?: string;
  className?: string;
  'data-testid'?: string;
}

export function LoadingCard({
  message = 'Ładowanie...',
  className,
  'data-testid': dataTestId,
}: LoadingCardProps) {
  return (
    <Card className={className} data-testid={dataTestId}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          data-testid="loading-spinner"
        />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

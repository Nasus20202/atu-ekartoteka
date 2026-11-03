import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  titleWidth?: string;
  description?: boolean;
  children?: React.ReactNode;
}

export function SkeletonCard({
  titleWidth = 'w-40',
  description = true,
  children,
}: SkeletonCardProps) {
  return (
    <Card className="hover:shadow">
      <CardHeader>
        <Skeleton className={`h-6 ${titleWidth}`} />
        {description && <Skeleton className="h-4 w-56 max-w-full" />}
      </CardHeader>
      {children && <CardContent className="space-y-3">{children}</CardContent>}
    </Card>
  );
}

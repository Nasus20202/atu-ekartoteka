import { Database } from 'lucide-react';

import { AssociationStatsSection } from '@/components/import/association-stats-section';
import { DatabaseStatsList } from '@/components/import/database-stats-list';
import { DatabaseStatsTable } from '@/components/import/database-stats-table';
import { ResponsiveStatsView } from '@/components/import/responsive-stats-view';
import { SUMMARY_TABLE_QUERY } from '@/components/import/stats-breakpoints';
import type { AssociationStatsState } from '@/components/import/types';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';
import { cn } from '@/lib/shared/utils';

interface DatabaseStatsCardProps {
  dbStats: DatabaseStatsDto | null;
  statsLoading: boolean;
  associations: AssociationStatsState;
}

export function DatabaseStatsCard({
  dbStats,
  statsLoading,
  associations,
}: DatabaseStatsCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Stan bazy danych
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="space-y-2" data-testid="stats-skeleton">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : dbStats ? (
          <div className={cn(REVEAL_CLASS, 'space-y-4')}>
            <ResponsiveStatsView
              tableQuery={SUMMARY_TABLE_QUERY}
              table={<DatabaseStatsTable stats={dbStats} />}
              list={<DatabaseStatsList stats={dbStats} />}
            />
            <AssociationStatsSection associations={associations} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nie udało się pobrać statystyk
          </p>
        )}
      </CardContent>
    </Card>
  );
}

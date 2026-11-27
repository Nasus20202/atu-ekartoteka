import { Database } from 'lucide-react';

import type { DatabaseStats } from '@/components/import/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const COLUMNS: Array<{ key: keyof DatabaseStats; label: string }> = [
  { key: 'hoa', label: 'Wspólnoty' },
  { key: 'apartments', label: 'Mieszkania' },
  { key: 'charges', label: 'Naliczenia' },
  { key: 'notifications', label: 'Powiadomienia' },
  { key: 'payments', label: 'Wpłaty' },
  { key: 'users', label: 'Użytkownicy' },
  { key: 'utilitySettlements', label: 'Rozliczenia mediów' },
  { key: 'meterReadings', label: 'Odczyty liczników' },
  { key: 'annualSettlements', label: 'Koszty rzeczywiste' },
];

interface DatabaseStatsCardProps {
  dbStats: DatabaseStats | null;
  statsLoading: boolean;
}

export function DatabaseStatsCard({
  dbStats,
  statsLoading,
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map(({ key, label }) => (
                    <TableHead key={key}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {COLUMNS.map(({ key }) => (
                    <TableCell key={key} className="font-medium">
                      {dbStats[key]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
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

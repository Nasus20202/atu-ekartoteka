import { Database } from 'lucide-react';

import type { DatabaseStats } from '@/app/admin/import/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        ) : dbStats ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wspólnoty</TableHead>
                  <TableHead>Mieszkania</TableHead>
                  <TableHead>Naliczenia</TableHead>
                  <TableHead>Powiadomienia</TableHead>
                  <TableHead>Wpłaty</TableHead>
                  <TableHead>Użytkownicy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{dbStats.hoa}</TableCell>
                  <TableCell className="font-medium">
                    {dbStats.apartments}
                  </TableCell>
                  <TableCell className="font-medium">
                    {dbStats.charges}
                  </TableCell>
                  <TableCell className="font-medium">
                    {dbStats.notifications}
                  </TableCell>
                  <TableCell className="font-medium">
                    {dbStats.payments}
                  </TableCell>
                  <TableCell className="font-medium">{dbStats.users}</TableCell>
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

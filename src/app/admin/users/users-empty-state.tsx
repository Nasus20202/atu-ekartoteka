import { AlertCircle } from 'lucide-react';

import type { UserFilter } from '@/app/admin/users/user-filters';
import { Card, CardContent } from '@/components/ui/card';
import { AccountStatus } from '@/lib/types';

function getEmptyMessage(search: string, filter: UserFilter): string {
  if (search) return 'Nie znaleziono użytkowników pasujących do wyszukiwania';
  if (filter === AccountStatus.PENDING) {
    return 'Brak kont oczekujących na zatwierdzenie';
  }
  return 'Nie znaleziono użytkowników';
}

export function UsersEmptyState({
  search,
  filter,
}: {
  search: string;
  filter: UserFilter;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Brak użytkowników</p>
        <p className="text-sm text-muted-foreground">
          {getEmptyMessage(search, filter)}
        </p>
      </CardContent>
    </Card>
  );
}

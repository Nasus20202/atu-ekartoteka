import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApartmentAssignedUserDto } from '@/lib/types/dto/apartment-dto';

export function AssignedUserCard({ user }: { user: ApartmentAssignedUserDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Przypisany użytkownik</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
            <p className="font-medium">{user.name || 'Brak'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

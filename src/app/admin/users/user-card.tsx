import { Edit, MoreVertical, UserCheck, UserX } from 'lucide-react';

import type { User } from '@/app/admin/users/types';
import { UserStatusBadge } from '@/app/admin/users/user-status-badge';
import { getApartmentSharePercent } from '@/app/admin/users/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountStatus } from '@/lib/types';

interface UserCardProps {
  actionLoading: boolean;
  onApprove: () => void;
  onAssignApartment: () => void;
  onChangeStatus: () => void;
  onReject: () => void;
  user: User;
}

export function UserCard({
  actionLoading,
  onApprove,
  onAssignApartment,
  onChangeStatus,
  onReject,
  user,
}: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{user.name || user.email}</CardTitle>
            <CardDescription className="mt-1">{user.email}</CardDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              Zarejestrowano:{' '}
              {new Date(user.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <UserStatusBadge status={user.status} />
        </div>
      </CardHeader>
      <CardContent>
        {user.apartments && user.apartments.length > 0 && (
          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="mb-2 text-sm font-medium">
              Przypisane mieszkania: {user.apartments.length}
            </p>
            <div className="space-y-1">
              {user.apartments.map((apartment) => {
                const sharePercent = getApartmentSharePercent(apartment);

                return (
                  <div
                    key={apartment.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {apartment.address} {apartment.building}/
                      {apartment.number}
                    </span>
                    <span>
                      {apartment.postalCode} {apartment.city}
                    </span>
                    {sharePercent && <span>{sharePercent}</span>}
                    {!apartment.isActive && (
                      <span className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                        Nieaktywny
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="hidden gap-2 sm:flex">
          {user.status === AccountStatus.PENDING && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                onClick={onApprove}
              >
                <UserCheck className="mr-1 h-4 w-4" />
                Zatwierdź
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                className="text-destructive hover:text-destructive"
                onClick={onReject}
              >
                <UserX className="mr-1 h-4 w-4" />
                Odrzuć
              </Button>
            </>
          )}
          {user.status === AccountStatus.APPROVED && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                onClick={onAssignApartment}
              >
                <Edit className="mr-1 h-4 w-4" />
                Mieszkania ({user.apartments?.length || 0})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                onClick={onChangeStatus}
              >
                <Edit className="mr-1 h-4 w-4" />
                Zmień status
              </Button>
            </>
          )}
          {user.status === AccountStatus.REJECTED && (
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={onChangeStatus}
            >
              <Edit className="mr-1 h-4 w-4" />
              Zmień status
            </Button>
          )}
        </div>

        <div className="flex gap-2 sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                aria-label="Akcje"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.status === AccountStatus.PENDING && (
                <>
                  <DropdownMenuItem onSelect={onApprove}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Zatwierdź
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={onReject}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Odrzuć
                  </DropdownMenuItem>
                </>
              )}
              {user.status === AccountStatus.APPROVED && (
                <>
                  <DropdownMenuItem onSelect={onAssignApartment}>
                    <Edit className="mr-2 h-4 w-4" />
                    Mieszkania ({user.apartments?.length || 0})
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onChangeStatus}>
                    <Edit className="mr-2 h-4 w-4" />
                    Zmień status
                  </DropdownMenuItem>
                </>
              )}
              {user.status === AccountStatus.REJECTED && (
                <DropdownMenuItem onSelect={onChangeStatus}>
                  <Edit className="mr-2 h-4 w-4" />
                  Zmień status
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

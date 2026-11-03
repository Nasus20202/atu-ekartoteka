import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  UserActionButtons,
  UserActionMenu,
  type UserActionsProps,
} from '@/components/users/user-actions';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { APP_LOCALE } from '@/lib/utils/locale';

export function UserCard(actionProps: UserActionsProps) {
  const { user } = actionProps;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="break-words">
              {user.name || user.email}
            </CardTitle>
            <CardDescription className="mt-1 break-words">
              {user.email}
            </CardDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              Zarejestrowano:{' '}
              {new Date(user.createdAt).toLocaleDateString(APP_LOCALE, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div className="shrink-0">
            <UserStatusBadge status={user.status} />
          </div>
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
                const sharePercent = formatSharePercent(apartment.shareRatio);

                return (
                  <div
                    key={apartment.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground"
                  >
                    <span className="min-w-0 break-words font-medium text-foreground">
                      {formatApartmentLabel(apartment)}
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
          <UserActionButtons {...actionProps} />
        </div>

        <div className="flex gap-2 sm:hidden">
          <UserActionMenu {...actionProps} />
        </div>
      </CardContent>
    </Card>
  );
}

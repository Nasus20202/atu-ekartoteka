import { formatCurrency } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

export type NotificationItem = {
  id: string;
  description: string;
  quantity: DecimalLike;
  unit: string;
  unitPrice: DecimalLike;
  totalAmount: DecimalLike;
  apartmentNumber: string;
  apartmentAddress: string;
  hoaId?: string | null;
  hoaName?: string | null;
  hoaHeader?: string | null;
};

interface ApartmentNotificationGroup {
  address: string;
  notifications: NotificationItem[];
}

function groupByApartment(
  notifications: NotificationItem[]
): ApartmentNotificationGroup[] {
  const groupMap = new Map<string, ApartmentNotificationGroup>();

  for (const notification of notifications) {
    const address = notification.apartmentAddress;
    const group = groupMap.get(address) ?? { address, notifications: [] };
    group.notifications.push(notification);
    groupMap.set(address, group);
  }

  return Array.from(groupMap.values());
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words">{notification.description}</span>
        <span className="shrink-0 font-semibold">
          {formatCurrency(notification.totalAmount)}
        </span>
      </div>
      {toDecimal(notification.quantity).greaterThan(0) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {toDecimal(notification.quantity).toString()} {notification.unit} ×{' '}
          {formatCurrency(notification.unitPrice)}
        </div>
      )}
    </div>
  );
}

export function ApartmentNotificationList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const groups = groupByApartment(notifications);
  const showSubtotals = groups.length > 1;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.address} className="space-y-2">
          <div className="flex items-start justify-between gap-2 text-sm">
            <h3 className="min-w-0 break-words font-medium">{group.address}</h3>
            {showSubtotals && (
              <span className="shrink-0 font-semibold">
                {formatCurrency(
                  sumDecimals(group.notifications.map((n) => n.totalAmount))
                )}
              </span>
            )}
          </div>
          {group.notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

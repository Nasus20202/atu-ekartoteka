import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  type ApartmentNotificationGroup,
  groupByApartment,
  type NotificationItem,
} from '@/components/dashboard/group-notifications';
import { HoaNotice } from '@/components/dashboard/hoa-notice';
import { MarqueeText } from '@/components/ui/marquee-text';
import { formatCurrency } from '@/lib/utils';
import { toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

const DEFAULT_HOA_NAME = 'Wspólnota';

function sumNotifications(notifications: NotificationItem[]) {
  return sumDecimals(notifications.map((n) => n.totalAmount));
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const quantity = toDecimal(notification.quantity);

  return (
    <div className="flex justify-between gap-3 border-t px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="break-words">{notification.description}</div>
        {quantity.greaterThan(0) && (
          <div className="text-xs text-muted-foreground">
            {quantity.toString()} {notification.unit} ×{' '}
            {formatCurrency(notification.unitPrice)}
          </div>
        )}
      </div>
      <span className="shrink-0 tabular-nums">
        {formatCurrency(notification.totalAmount)}
      </span>
    </div>
  );
}

function CardHeading({
  title,
  subtitle,
  notifications,
}: {
  title: ReactNode;
  subtitle?: string | null;
  notifications: NotificationItem[];
}) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 text-sm">
      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold">{title}</h3>
        {subtitle && (
          <p className="break-words text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <span className="shrink-0 font-semibold tabular-nums">
        {formatCurrency(sumNotifications(notifications))}
      </span>
    </div>
  );
}

function ApartmentSection({ group }: { group: ApartmentNotificationGroup }) {
  return (
    <section>
      <div className="flex items-center gap-3 border-t bg-muted/30 px-4 py-2 text-sm font-medium">
        <h4 className="min-w-0 flex-1">
          <MarqueeText>{group.address}</MarqueeText>
        </h4>
        <span className="shrink-0 tabular-nums">
          {formatCurrency(sumNotifications(group.notifications))}
        </span>
      </div>
      {group.notifications.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </section>
  );
}

export function HoaNotificationCard({
  hoaName,
  hoaHeader,
  notifications,
}: {
  hoaName: string | null;
  hoaHeader: string | null;
  notifications: NotificationItem[];
}) {
  const apartments = groupByApartment(notifications);
  const [single] = apartments;
  const isSingleApartment = apartments.length === 1;
  const notice = hoaHeader && <HoaNotice header={hoaHeader} />;

  return (
    <article className="overflow-hidden rounded-lg border">
      {isSingleApartment ? (
        <>
          <CardHeading
            title={<MarqueeText>{single.address}</MarqueeText>}
            subtitle={hoaName}
            notifications={notifications}
          />
          {notice}
          {single.notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </>
      ) : (
        <>
          <CardHeading
            title={hoaName ?? DEFAULT_HOA_NAME}
            notifications={notifications}
          />
          {notice}
          {apartments.map((group) => (
            <ApartmentSection key={group.address} group={group} />
          ))}
        </>
      )}
    </article>
  );
}

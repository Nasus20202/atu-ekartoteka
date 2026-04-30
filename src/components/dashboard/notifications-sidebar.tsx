'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatCurrency } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

type NotificationItem = {
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

interface HoaNotificationGroup {
  hoaId: string | null;
  hoaName: string | null;
  hoaHeader: string | null;
  notifications: NotificationItem[];
  subtotal: ReturnType<typeof sumDecimals>;
}

interface NotificationsSidebarProps {
  notifications: NotificationItem[];
}

function groupByHoa(notifications: NotificationItem[]): HoaNotificationGroup[] {
  const groupMap = new Map<string, HoaNotificationGroup>();
  const noHoaKey = '__no_hoa__';

  for (const n of notifications) {
    const key = n.hoaId ?? noHoaKey;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        hoaId: n.hoaId ?? null,
        hoaName: n.hoaName ?? null,
        hoaHeader: n.hoaHeader ?? null,
        notifications: [],
        subtotal: sumDecimals([]),
      });
    }
    const group = groupMap.get(key)!;
    group.notifications.push(n);
    group.subtotal = group.subtotal.plus(n.totalAmount);
  }

  return Array.from(groupMap.values());
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium">
          {notification.apartmentAddress}
        </span>
        <span className="shrink-0 font-semibold">
          {formatCurrency(notification.totalAmount)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {notification.description}
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

function HoaGroup({ group }: { group: HoaNotificationGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted">
        <span className="font-medium">{group.hoaName ?? 'Wspólnota'}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold">
            {formatCurrency(group.subtotal)}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {group.hoaHeader && (
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="whitespace-pre-line text-xs text-muted-foreground">
                {group.hoaHeader}
              </p>
            </div>
          )}
          {group.notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const NotificationsSidebar = ({
  notifications,
}: NotificationsSidebarProps) => {
  if (notifications.length === 0) {
    return null;
  }

  const totalAmount = sumDecimals(
    notifications.map((notification) => notification.totalAmount)
  );
  const hoaGroups = groupByHoa(notifications);
  const isSingle = hoaGroups.length === 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Powiadomienia</CardTitle>
        <CardDescription>Bieżące naliczenia czynszowe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isSingle ? (
            <>
              {/* Single HOA: show total + optional header + flat list */}
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm text-muted-foreground">
                  Łączna kwota do zapłaty
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              {hoaGroups[0].hoaHeader && (
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="whitespace-pre-line text-xs text-muted-foreground">
                    {hoaGroups[0].hoaHeader}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {hoaGroups[0].notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Multiple HOAs: grand total + collapsible per HOA */}
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm text-muted-foreground">
                  Łączna kwota do zapłaty
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              {hoaGroups.map((group, gi) => (
                <HoaGroup key={group.hoaId ?? gi} group={group} />
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

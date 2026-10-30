import type { NotificationItem } from '@/components/dashboard/group-notifications';
import { HoaNotificationCard } from '@/components/dashboard/hoa-notification-card';
import { DownloadNoticePdfButton } from '@/components/pdf/download-notice-pdf-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { sumDecimals } from '@/lib/utils/sum';

interface HoaNotificationGroup {
  hoaId: string | null;
  hoaName: string | null;
  hoaHeader: string | null;
  notifications: NotificationItem[];
}

interface NotificationsSidebarProps {
  notifications: NotificationItem[];
}

const NO_HOA_KEY = '__no_hoa__';

function groupByHoa(notifications: NotificationItem[]): HoaNotificationGroup[] {
  const groupMap = new Map<string, HoaNotificationGroup>();

  for (const n of notifications) {
    const key = n.hoaId ?? NO_HOA_KEY;
    const group = groupMap.get(key) ?? {
      hoaId: n.hoaId ?? null,
      hoaName: n.hoaName ?? null,
      hoaHeader: n.hoaHeader ?? null,
      notifications: [],
    };
    group.notifications.push(n);
    groupMap.set(key, group);
  }

  return Array.from(groupMap.values());
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Powiadomienia</CardTitle>
        <CardDescription>Bieżące naliczenia czynszowe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">
                Łączna kwota do zapłaty
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <DownloadNoticePdfButton notifications={notifications} />
          </div>
          {groupByHoa(notifications).map((group) => (
            <HoaNotificationCard
              key={group.hoaId ?? NO_HOA_KEY}
              hoaName={group.hoaName}
              hoaHeader={group.hoaHeader}
              notifications={group.notifications}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

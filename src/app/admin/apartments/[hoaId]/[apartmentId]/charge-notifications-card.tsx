import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ChargeNotificationDto } from '@/lib/types/dto/apartment-dto';
import { formatCurrency } from '@/lib/utils';
import { sumDecimals } from '@/lib/utils/sum';

export function ChargeNotificationsCard({
  notifications,
}: {
  notifications: ChargeNotificationDto[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Powiadomienia czynszowe</CardTitle>
        <CardDescription>
          Aktywne pozycje opłat ({notifications.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between border-b pb-2 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.quantity} {notification.unit} ×{' '}
                  {formatCurrency(notification.unitPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(notification.totalAmount)}
                </p>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 font-bold">
            <div className="flex justify-between">
              <span>Razem:</span>
              <span>
                {formatCurrency(
                  sumDecimals(
                    notifications.map(
                      (notification) => notification.totalAmount
                    )
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

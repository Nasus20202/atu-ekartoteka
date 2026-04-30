import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency, MONTH_NAMES_PL } from '@/lib/utils';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

type ChargeNotificationCardItem = {
  id: string;
  description: string;
  quantity: DecimalLike;
  unit: string;
  unitPrice: DecimalLike;
  totalAmount: DecimalLike;
};

interface ChargeNotificationsCardProps {
  notifications: ChargeNotificationCardItem[];
  hoaHeader?: string | null;
}

export const ChargeNotificationsCard = ({
  notifications,
  hoaHeader,
}: ChargeNotificationsCardProps) => {
  if (notifications.length === 0) {
    return null;
  }

  const totalAmount = sumDecimals(
    notifications.map((notification) => notification.totalAmount)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Powiadomienia czynszowe</CardTitle>
        <CardDescription>
          Miesięczne opłaty za {MONTH_NAMES_PL[new Date().getMonth()]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hoaHeader && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {hoaHeader}
            </p>
          )}

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
                    {toDecimal(notification.quantity).toString()}{' '}
                    {notification.unit} ×{' '}
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
          </div>

          <div className="flex items-center justify-between border-t pt-4 font-bold">
            <span>Razem do zapłaty:</span>
            <span className="text-lg">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

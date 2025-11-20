import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChargeNotification } from '@/lib/types';

interface ChargeNotificationsCardProps {
  notifications: ChargeNotification[];
}

const MONTH_NAMES_PL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

export const ChargeNotificationsCard = ({
  notifications,
}: ChargeNotificationsCardProps) => {
  if (notifications.length === 0) {
    return null;
  }

  const totalAmount = notifications.reduce((sum, n) => sum + n.totalAmount, 0);

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
                    {notification.unitPrice.toFixed(2)} zł
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {notification.totalAmount.toFixed(2)} zł
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4 font-bold">
            <span>Razem do zapłaty:</span>
            <span className="text-lg">{totalAmount.toFixed(2)} zł</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChargeNotification } from '@/generated/prisma';

interface NotificationsSidebarProps {
  notifications: Array<
    ChargeNotification & {
      apartmentNumber: string;
      apartmentAddress: string;
    }
  >;
}

export const NotificationsSidebar = ({
  notifications,
}: NotificationsSidebarProps) => {
  if (notifications.length === 0) {
    return null;
  }

  const totalAmount = notifications.reduce((sum, n) => sum + n.totalAmount, 0);

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Powiadomienia</CardTitle>
        <CardDescription>Bieżące naliczenia czynszowe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm text-muted-foreground">
              Łączna kwota do zapłaty
            </div>
            <div className="text-2xl font-bold">
              {totalAmount.toFixed(2)} zł
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">
                    {notification.apartmentAddress}
                  </span>
                  <span className="font-semibold">
                    {notification.totalAmount.toFixed(2)} zł
                  </span>
                </div>
                <div className="mb-1 text-xs text-muted-foreground">
                  Lokal {notification.apartmentNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  {notification.description}
                </div>
                {notification.quantity > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {notification.quantity} {notification.unit} ×{' '}
                    {notification.unitPrice.toFixed(2)} zł
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

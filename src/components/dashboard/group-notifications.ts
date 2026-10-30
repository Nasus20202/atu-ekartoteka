import type { DecimalLike } from '@/lib/utils/decimal';

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
  hoaFooter?: string | null;
};

export interface ApartmentNotificationGroup {
  address: string;
  notifications: NotificationItem[];
}

export function groupByApartment(
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

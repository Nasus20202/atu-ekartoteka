export type { Charge, ChargeNotification } from '@/generated/prisma/client';

export type ChargeDisplay = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  dateFrom: Date;
  dateTo: Date;
};

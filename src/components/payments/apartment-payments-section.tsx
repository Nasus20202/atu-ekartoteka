'use client';

import { AdminPaymentsList } from '@/components/payments/admin-payments-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';

interface ApartmentPaymentsSectionProps {
  payments: PaymentDtoSource[];
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
}

export function ApartmentPaymentsSection({
  payments,
  apartmentId,
  apartmentLabel,
  hoaName,
}: ApartmentPaymentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia wpłat</CardTitle>
        <CardDescription>
          Zapisane okresy rozliczeniowe ({payments.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminPaymentsList
          payments={payments}
          apartmentId={apartmentId}
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
        />
      </CardContent>
    </Card>
  );
}

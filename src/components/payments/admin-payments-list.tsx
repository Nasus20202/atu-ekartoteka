'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { PaymentTable } from '@/components/payment-table';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Payment } from '@/lib/types';

type SerializablePayment = Omit<
  Payment,
  'dateFrom' | 'dateTo' | 'createdAt' | 'updatedAt'
> & {
  dateFrom: string;
  dateTo: string;
  createdAt: string;
  updatedAt: string;
};

interface AdminPaymentsListProps {
  payments: Payment[];
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
}

function toSerializable(payment: Payment): SerializablePayment {
  return {
    ...payment,
    dateFrom:
      payment.dateFrom instanceof Date
        ? payment.dateFrom.toISOString()
        : String(payment.dateFrom),
    dateTo:
      payment.dateTo instanceof Date
        ? payment.dateTo.toISOString()
        : String(payment.dateTo),
    createdAt:
      payment.createdAt instanceof Date
        ? payment.createdAt.toISOString()
        : String(payment.createdAt),
    updatedAt:
      payment.updatedAt instanceof Date
        ? payment.updatedAt.toISOString()
        : String(payment.updatedAt),
  };
}

function sumMonths(payment: Payment, field: 'Payments' | 'Charges'): number {
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ] as const;
  return months.reduce((sum, month) => {
    const key = `${month}${field}` as keyof Payment;
    return sum + (Number(payment[key]) || 0);
  }, 0);
}

function PaymentYearSection({
  payment,
  apartmentId,
  apartmentLabel,
  hoaName,
  defaultOpen,
}: {
  payment: Payment;
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalPayments = sumMonths(payment, 'Payments');
  const totalCharges = sumMonths(payment, 'Charges');
  const serializable = toSerializable(payment);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
          <div className="flex items-center gap-4">
            <span>Rok {payment.year}</span>
            <span
              className={`text-base font-bold ${payment.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {payment.closingBalance.toFixed(2)} zł
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <DownloadPaymentPdfButton
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          payment={serializable}
        />
      </div>
      <CollapsibleContent>
        <div className="mt-2 space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="font-medium">Saldo początkowe:</div>
            <div
              className={`text-right ${payment.openingBalance < 0 ? 'text-red-600' : payment.openingBalance > 0 ? 'text-green-600' : ''}`}
            >
              {payment.openingBalance.toFixed(2)} zł
            </div>
            <div className="font-medium">Naliczenie:</div>
            <div className="text-right">{totalCharges.toFixed(2)} zł</div>
            <div className="font-medium">Suma wpłat:</div>
            <div className="text-right">{totalPayments.toFixed(2)} zł</div>
            <div className="border-t pt-2 font-bold">Saldo końcowe:</div>
            <div
              className={`border-t pt-2 text-right font-bold ${payment.closingBalance < 0 ? 'text-red-600' : payment.closingBalance > 0 ? 'text-green-600' : ''}`}
            >
              {payment.closingBalance.toFixed(2)} zł
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-semibold">
              Wpłaty / Naliczenia miesięczne
            </p>
            <PaymentTable
              payment={payment}
              apartmentId={apartmentId}
              disableLinks
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdminPaymentsList({
  payments,
  apartmentId,
  apartmentLabel,
  hoaName,
}: AdminPaymentsListProps) {
  const currentYear = new Date().getFullYear();
  const sorted = [...payments].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-2">
      {sorted.map((payment) => (
        <PaymentYearSection
          key={payment.id}
          payment={payment}
          apartmentId={apartmentId}
          apartmentLabel={apartmentLabel}
          hoaName={hoaName}
          defaultOpen={payment.year === currentYear}
        />
      ))}
    </div>
  );
}

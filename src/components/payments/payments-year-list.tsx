'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SerializablePayment } from '@/lib/payments/serialize-payment';

interface PaymentEntry {
  payment: SerializablePayment;
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  dateFromLabel: string;
  dateToLabel: string;
}

interface YearGroup {
  year: number;
  entries: PaymentEntry[];
}

interface PaymentsYearListProps {
  payments: PaymentEntry[];
}

function groupByYear(payments: PaymentEntry[]): YearGroup[] {
  const yearMap = new Map<number, PaymentEntry[]>();
  for (const entry of payments) {
    const y = entry.payment.year;
    if (!yearMap.has(y)) yearMap.set(y, []);
    yearMap.get(y)!.push(entry);
  }
  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, entries]) => ({ year, entries }));
}

function YearSection({ group }: { group: YearGroup }) {
  const currentYear = new Date().getFullYear();
  const [open, setOpen] = useState(group.year === currentYear);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
        <span>Rok {group.year}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {group.entries.map((entry) => (
            <PaymentYearRow
              key={entry.payment.id}
              apartmentId={entry.apartmentId}
              apartmentLabel={entry.apartmentLabel}
              hoaName={entry.hoaName}
              payment={entry.payment}
              dateFromLabel={entry.dateFromLabel}
              dateToLabel={entry.dateToLabel}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PaymentsYearList({ payments }: PaymentsYearListProps) {
  const yearGroups = groupByYear(payments);
  return (
    <div className="space-y-2">
      {yearGroups.map((group) => (
        <YearSection key={group.year} group={group} />
      ))}
    </div>
  );
}

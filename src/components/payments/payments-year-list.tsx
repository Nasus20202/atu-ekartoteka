'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { PaymentYearRow } from '@/components/payments/payment-year-row';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { PaymentListItemDto } from '@/lib/types/dto/payment-dto';
import { groupByYearDesc, type YearGroup } from '@/lib/utils/group-by-year';

interface PaymentEntry {
  payment: PaymentListItemDto;
  apartmentId: string;
  apartmentLabel: string;
  hoaName: string;
  dateFromLabel: string;
  dateToLabel: string;
}

type PaymentYearGroup = YearGroup<number, PaymentEntry>;

interface PaymentsYearListProps {
  payments: PaymentEntry[];
}

function YearSection({ group }: { group: PaymentYearGroup }) {
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
          {group.items.map((entry) => (
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
  const yearGroups = groupByYearDesc(payments, (entry) => entry.payment.year);
  return (
    <div className="space-y-2">
      {yearGroups.map((group) => (
        <YearSection key={group.year} group={group} />
      ))}
    </div>
  );
}

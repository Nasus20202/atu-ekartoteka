'use client';

import { useRouter } from 'next/navigation';

import { Select } from '@/components/ui/select';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';

interface PaymentYearSelectProps {
  apartmentId: string;
  year: number;
  years: number[];
}

export function PaymentYearSelect({
  apartmentId,
  year,
  years,
}: PaymentYearSelectProps) {
  const router = useRouter();

  return (
    <Select
      aria-label="Rok"
      className="w-32"
      value={String(year)}
      options={years.map((y) => ({ label: `Rok ${y}`, value: String(y) }))}
      onValueChange={(next) =>
        router.replace(getPaymentYearHref(apartmentId, next))
      }
    />
  );
}

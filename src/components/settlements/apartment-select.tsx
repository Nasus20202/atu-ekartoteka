'use client';

import { useRouter } from 'next/navigation';

import { apartmentSettlementsPath } from '@/components/settlements/settlement-view-key';
import { useSettlementView } from '@/components/settlements/use-settlement-view';
import { Select } from '@/components/ui/select';

interface Props {
  apartmentId: string;
  options: Array<{ value: string; label: string }>;
}

export function ApartmentSelect({ apartmentId, options }: Props) {
  const router = useRouter();
  const { view } = useSettlementView();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Lokal</span>
      <Select
        aria-label="Lokal"
        className="w-52 text-foreground"
        value={apartmentId}
        options={options}
        // The periods belong to the apartment, so only the view is carried over
        onValueChange={(id) =>
          router.replace(apartmentSettlementsPath(id, view), { scroll: false })
        }
      />
    </div>
  );
}

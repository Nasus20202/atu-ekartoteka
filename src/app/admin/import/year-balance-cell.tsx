import type { ReactNode } from 'react';

import { YearBalanceDetails } from '@/app/admin/import/year-balance-details';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { YearBalanceRow } from '@/lib/import/types';

const VALUE_BUTTON_CLASS =
  'h-auto w-full flex-col items-end gap-0 whitespace-normal px-2 py-1 font-[inherit] tabular-nums hover:text-current';
const CONTENT_CLASS =
  'w-[560px] max-w-[calc(100vw-2rem)] bg-popover p-3 text-xs opacity-100';

export function YearBalanceCell({
  hoaName,
  row,
  className,
  children,
}: {
  hoaName: string;
  row: YearBalanceRow;
  className?: string;
  children: ReactNode;
}) {
  return (
    <td className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={VALUE_BUTTON_CLASS}>
            {children}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={CONTENT_CLASS}>
          <YearBalanceDetails hoaName={hoaName} row={row} />
        </PopoverContent>
      </Popover>
    </td>
  );
}

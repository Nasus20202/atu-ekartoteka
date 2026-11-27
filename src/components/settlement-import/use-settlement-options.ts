'use client';

import { useState } from 'react';

import { confirmSteps } from '@/components/import/confirm-steps';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { OPTION_CONFIRMATIONS } from '@/components/settlement-import/option-confirmations';
import { STANDARD_IMPORT } from '@/lib/settlements/rules/import-options';
import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';

/** The options of the settlement import; switching one on is confirmed. */
export function useSettlementOptions(onChange: () => void) {
  const confirm = useConfirm();
  const [options, setOptions] = useState(STANDARD_IMPORT);

  const setOption = async (
    name: keyof SettlementImportOptions,
    checked: boolean
  ) => {
    if (checked && !(await confirmSteps(confirm, OPTION_CONFIRMATIONS[name]))) {
      return;
    }
    setOptions((current) => ({ ...current, [name]: checked }));
    onChange();
  };

  return { options, setOption, confirm } as const;
}

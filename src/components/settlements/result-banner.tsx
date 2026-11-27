import type { ReactNode } from 'react';

import {
  RESULT_BANNER_CLASSES,
  RESULT_TEXT_CLASSES,
} from '@/components/settlements/result-tone';
import { formatAbsoluteAmount } from '@/lib/settlements/rules/view-format';
import { resultKind } from '@/lib/settlements/rules/view-wording';
import { cn } from '@/lib/shared/utils';

interface Props {
  label: string;
  title: string;
  amount: string;
  children: ReactNode;
}

export function ResultBanner({ label, title, amount, children }: Props) {
  const kind = resultKind(amount);

  return (
    <section
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center justify-between gap-6 rounded-xl border p-6',
        RESULT_BANNER_CLASSES[kind]
      )}
    >
      <div className={RESULT_TEXT_CLASSES[kind]}>
        <div className="font-semibold">{title}</div>
        <div className="text-4xl font-bold">{formatAbsoluteAmount(amount)}</div>
      </div>
      {children}
    </section>
  );
}

import { RESULT_TEXT_CLASSES } from '@/components/settlements/result-tone';
import { formatAbsoluteAmount } from '@/lib/settlements/rules/view-format';
import {
  RESULT_LABELS,
  resultKind,
} from '@/lib/settlements/rules/view-wording';
import { cn } from '@/lib/shared/utils';

interface Props {
  amount: string;
  className?: string;
}

/** An amount with the word that says its direction, so colour is not needed. */
export function ResultAmount({ amount, className }: Props) {
  const kind = resultKind(amount);

  return (
    <div className={cn(RESULT_TEXT_CLASSES[kind], className)}>
      <div className="text-xl font-bold">{formatAbsoluteAmount(amount)}</div>
      <div>{RESULT_LABELS[kind]}</div>
    </div>
  );
}

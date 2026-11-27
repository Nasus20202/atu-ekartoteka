import type { ResultKind } from '@/lib/settlements/rules/view-wording';

// The sign is the opposite of balances: a positive amount is still to pay
export const RESULT_TEXT_CLASSES: Record<ResultKind, string> = {
  overpaid: 'text-green-700 dark:text-green-400',
  due: 'text-red-700 dark:text-red-400',
  even: 'text-foreground',
};

export const RESULT_BANNER_CLASSES: Record<ResultKind, string> = {
  overpaid:
    'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
  due: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  even: 'bg-muted',
};

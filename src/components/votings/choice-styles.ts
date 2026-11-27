import {
  CircleCheck,
  CircleMinus,
  CircleX,
  type LucideIcon,
} from 'lucide-react';

import { VoteChoice } from '@/lib/voting/types/voting';

interface ChoiceStyle {
  icon: LucideIcon;
  /** Colour of the icon next to a recorded answer */
  tone: string;
  /** Look of the answer while it is selected */
  active: string;
  /** Small label of an answer in a list of voters */
  chip: string;
  /** Bar of the results */
  bar: string;
}

/** The icon and colour of each answer, the same wherever answers are shown. */
export const CHOICE_STYLES: Record<VoteChoice, ChoiceStyle> = {
  [VoteChoice.FOR]: {
    icon: CircleCheck,
    tone: 'text-green-600 dark:text-green-500',
    active:
      'border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
    chip: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    bar: 'bg-green-500',
  },
  [VoteChoice.AGAINST]: {
    icon: CircleX,
    tone: 'text-red-600 dark:text-red-500',
    active:
      'border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
    chip: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    bar: 'bg-red-500',
  },
  [VoteChoice.ABSTAIN]: {
    icon: CircleMinus,
    tone: 'text-amber-600 dark:text-amber-400',
    active:
      'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    bar: 'bg-amber-500',
  },
};

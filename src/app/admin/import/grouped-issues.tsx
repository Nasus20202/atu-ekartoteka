import type { IssueGroup } from '@/app/admin/import/issue-groups';
import { cn } from '@/lib/utils';

type Tone = 'warning' | 'error';

const TONE_CLASSES: Record<
  Tone,
  { title: string; description: string; item: string }
> = {
  warning: {
    title: 'text-orange-700 dark:text-orange-300',
    description: 'text-orange-700/80 dark:text-orange-200/80',
    item: 'text-orange-700/90 dark:text-orange-200',
  },
  error: {
    title: 'text-destructive dark:text-red-300',
    description: 'text-destructive/80 dark:text-red-400',
    item: 'text-destructive/80 dark:text-red-400',
  },
};

interface GroupedIssuesProps<K extends string, T> {
  groups: IssueGroup<K, T>[];
  tone: Tone;
  formatItem: (item: T) => string;
}

/** Warnings or errors under a heading per kind; the caller provides the container. */
export function GroupedIssues<K extends string, T>({
  groups,
  tone,
  formatItem,
}: GroupedIssuesProps<K, T>) {
  if (groups.length === 0) {
    return null;
  }

  const classes = TONE_CLASSES[tone];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.kind} className="space-y-1">
          <h4 className={cn('text-sm font-medium', classes.title)}>
            {group.title} ({group.items.length})
          </h4>
          <p className={cn('text-xs', classes.description)}>
            {group.description}
          </p>
          <ul className={cn('space-y-1 text-sm', classes.item)}>
            {group.items.map((item, idx) => (
              <li key={idx}>• {formatItem(item)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

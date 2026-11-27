import type { Usage } from '@/lib/settlements/rules/view-wording';

interface Props {
  usage: Usage;
}

export function UsageBar({ usage }: Props) {
  return (
    <div
      role="img"
      aria-label={usage.label}
      title={usage.label}
      className="mt-2 flex h-2 overflow-hidden rounded bg-muted"
    >
      <div className="bg-primary" style={{ width: `${usage.used}%` }} />
      {usage.excess > 0 && (
        <div className="bg-destructive" style={{ width: `${usage.excess}%` }} />
      )}
    </div>
  );
}

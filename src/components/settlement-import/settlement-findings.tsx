import { GroupedIssues } from '@/components/import/grouped-issues';
import { groupFindings } from '@/components/settlement-import/finding-groups';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

interface Props {
  errors: SettlementIssue[];
  warnings: SettlementIssue[];
}

const formatFinding = ({ page, message }: SettlementIssue) =>
  page === undefined ? message : `Strona ${page}, ${message}`;

const SECTIONS = [
  {
    key: 'errors',
    tone: 'error',
    title: 'Błędy',
    box: 'border-destructive/50 bg-destructive/10',
  },
  {
    key: 'warnings',
    tone: 'warning',
    title: 'Ostrzeżenia',
    box: 'border-orange-500/50 bg-orange-500/10',
  },
] as const;

export function SettlementFindings(props: Props) {
  return SECTIONS.map(({ key, tone, title, box }) =>
    props[key].length > 0 ? (
      <div key={key} className={`space-y-4 rounded-lg border p-3 ${box}`}>
        <p className="text-sm font-medium">
          {title} ({props[key].length})
        </p>
        <GroupedIssues
          groups={groupFindings(props[key])}
          tone={tone}
          formatItem={formatFinding}
        />
      </div>
    ) : null
  );
}

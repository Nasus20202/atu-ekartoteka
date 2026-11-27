import { formatSpan } from '@/lib/settlements/rules/format';
import type {
  SettlementIssue,
  SettlementIssueKind,
} from '@/lib/settlements/types/settlement-issue';

export type IssueContext = Pick<
  SettlementIssue,
  'fileName' | 'page' | 'apartmentExternalId'
> & {
  /** Names the record in front of every message */
  subject: string;
};

export const recordSubject = (
  apartment: string,
  record: { printedOwner: string; periodFrom: string; periodTo: string }
) =>
  `${apartment}, ${record.printedOwner}, okres ${formatSpan(record.periodFrom, record.periodTo)}`;

const create =
  (severity: SettlementIssue['severity']) =>
  (
    { subject, ...context }: IssueContext,
    kind: SettlementIssueKind,
    message: string
  ): SettlementIssue => ({
    ...context,
    kind,
    severity,
    message: `${subject}: ${message}`,
  });

export const errorIssue = create('error');
export const warningIssue = create('warning');

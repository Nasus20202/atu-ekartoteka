import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/shared/utils';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import { formatDateTime } from '@/lib/shared/utils/format-date-time';
import type { VoterDto, VotingQuestionDto } from '@/lib/voting/dto/voting-dto';
import { VOTE_CHOICE_LABELS } from '@/lib/voting/rules/voting-status';
import { VoteChoice } from '@/lib/voting/types/voting';

const CHOICE_CLASSES: Record<VoteChoice, string> = {
  [VoteChoice.FOR]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [VoteChoice.AGAINST]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [VoteChoice.ABSTAIN]: 'bg-muted text-muted-foreground',
};

interface Props {
  voters: VoterDto[];
  questions: VotingQuestionDto[];
}

export function VotingVotersTable({ voters, questions }: Props) {
  if (voters.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nikt jeszcze nie zagłosował.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Właściciel</TableHead>
            <TableHead>Lokal</TableHead>
            <TableHead>Data głosu</TableHead>
            <TableHead>Odpowiedzi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter) => (
            <TableRow key={voter.ballotId}>
              <TableCell>
                <div className="font-medium">{voter.voterName}</div>
                <div className="text-xs text-muted-foreground">
                  {voter.voterEmail}
                </div>
              </TableCell>
              <TableCell>{formatApartmentLabel(voter.apartment)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(voter.votedAt)}
              </TableCell>
              <TableCell>
                <ul className="flex flex-wrap gap-1.5">
                  {questions.map((question, index) => {
                    const choice = voter.answers[question.id];

                    return (
                      <li
                        key={question.id}
                        title={question.text}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          choice && CHOICE_CLASSES[choice]
                        )}
                      >
                        {index + 1}. {choice ? VOTE_CHOICE_LABELS[choice] : '—'}
                      </li>
                    );
                  })}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnswerChips } from '@/components/votings/answer-chips';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import { formatDateTime } from '@/lib/shared/utils/format-date-time';
import type { VoterDto, VotingQuestionDto } from '@/lib/voting/dto/voting-dto';

interface Props {
  voters: VoterDto[];
  questions: VotingQuestionDto[];
}

function Voter({ voter }: { voter: VoterDto }) {
  return (
    <>
      <div className="font-medium">{voter.voterName}</div>
      {voter.fromMeeting ? (
        <Badge variant="secondary" className="mt-1">
          Z zebrania
        </Badge>
      ) : (
        <div className="break-all text-xs text-muted-foreground">
          {voter.voterEmail}
        </div>
      )}
    </>
  );
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
    <>
      {/* Narrow screens: one card per apartment instead of a clipped table */}
      <ul className="space-y-3 md:hidden">
        {voters.map((voter) => (
          <li key={voter.ballotId}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <Voter voter={voter} />
                <p className="text-sm">
                  {formatApartmentLabel(voter.apartment)}
                  <span className="block text-xs text-muted-foreground">
                    {formatDateTime(voter.votedAt)}
                  </span>
                </p>
                <AnswerChips answers={voter.answers} questions={questions} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="hidden overflow-hidden md:block">
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
                  <Voter voter={voter} />
                </TableCell>
                <TableCell>{formatApartmentLabel(voter.apartment)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(voter.votedAt)}
                </TableCell>
                <TableCell>
                  <AnswerChips answers={voter.answers} questions={questions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

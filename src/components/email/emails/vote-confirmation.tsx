import { Fragment } from 'react';

import { ActionButton } from '@/components/email/action-button';
import { EmailLayout } from '@/components/email/email-layout';
import { greeting, Note, Paragraph } from '@/components/email/email-text';
import type { BallotSummary } from '@/lib/voting/types/voting';

export const VOTE_CONFIRMATION_SUBJECT = 'Potwierdź swój głos';

interface Props {
  name?: string;
  votingTitle: string;
  ballots: BallotSummary[];
  url: string;
  validForMinutes: number;
}

export function VoteConfirmationEmail({
  name,
  votingTitle,
  ballots,
  url,
  validForMinutes,
}: Props) {
  return (
    <EmailLayout title={VOTE_CONFIRMATION_SUBJECT}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Aby oddać głos w głosowaniu „{votingTitle}”, potwierdź swoją tożsamość,
        otwierając poniższy link w zalogowanej aplikacji.
      </Paragraph>
      {ballots.map((ballot) => (
        <Fragment key={ballot.apartment}>
          <Paragraph>
            <strong>Lokal {ballot.apartment}</strong>
          </Paragraph>
          {ballot.answers.map(({ question, answer }, index) => (
            <Note key={index}>{`${index + 1}. ${question} – ${answer}`}</Note>
          ))}
        </Fragment>
      ))}
      <ActionButton href={url} label="Potwierdź głos" />
      <Note>
        {`Link jest ważny przez ${validForMinutes} minut i można go użyć tylko raz.`}
      </Note>
      <Note>
        Jeśli nie oddawałeś głosu, zignoruj tę wiadomość i nikomu nie przekazuj
        linku.
      </Note>
    </EmailLayout>
  );
}

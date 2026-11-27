import { ActionButton } from '@/components/email/action-button';
import { EmailLayout } from '@/components/email/email-layout';
import { greeting, Note, Paragraph } from '@/components/email/email-text';

export const VOTE_CONFIRMATION_SUBJECT = 'Potwierdź swój głos';

interface Props {
  name?: string;
  votingTitle: string;
  url: string;
  validForMinutes: number;
}

export function VoteConfirmationEmail({
  name,
  votingTitle,
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

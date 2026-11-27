import { DetailsBox, StackedDetail } from '@/components/email/details-box';
import { EmailLayout } from '@/components/email/email-layout';
import { greeting, Note, Paragraph } from '@/components/email/email-text';

export const VOTE_CONFIRMATION_SUBJECT = 'Kod potwierdzający głosowanie';

interface Props {
  name?: string;
  votingTitle: string;
  code: string;
  validForMinutes: number;
}

export function VoteConfirmationEmail({
  name,
  votingTitle,
  code,
  validForMinutes,
}: Props) {
  return (
    <EmailLayout title={VOTE_CONFIRMATION_SUBJECT}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Aby oddać głos w głosowaniu „{votingTitle}”, wpisz poniższy kod w
        aplikacji.
      </Paragraph>
      <DetailsBox>
        <StackedDetail label="Kod potwierdzający" value={code} last />
      </DetailsBox>
      <Note>
        Kod jest ważny przez {validForMinutes} minut i można go użyć tylko raz.
      </Note>
      <Note>
        Jeśli nie oddawałeś głosu, zignoruj tę wiadomość i nikomu nie podawaj
        kodu.
      </Note>
    </EmailLayout>
  );
}

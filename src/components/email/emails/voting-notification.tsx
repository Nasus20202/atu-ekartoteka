import { ActionButton } from '@/components/email/action-button';
import { DetailsBox, InlineDetail } from '@/components/email/details-box';
import { EmailLayout } from '@/components/email/email-layout';
import { greeting, Note, Paragraph } from '@/components/email/email-text';

export const VOTING_NOTIFICATION_SUBJECT =
  'Nowe głosowanie w Twojej wspólnocie';

interface Props {
  name?: string;
  votingTitle: string;
  hoaName: string;
  endsAt?: string;
  url: string;
}

export function VotingNotificationEmail({
  name,
  votingTitle,
  hoaName,
  endsAt,
  url,
}: Props) {
  return (
    <EmailLayout title={VOTING_NOTIFICATION_SUBJECT}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Administrator zaprasza do udziału w głosowaniu. Prosimy o oddanie głosu.
      </Paragraph>
      <DetailsBox>
        <InlineDetail label="Głosowanie" value={votingTitle} />
        <InlineDetail label="Wspólnota" value={hoaName} />
        {endsAt && <InlineDetail label="Termin" value={endsAt} />}
      </DetailsBox>
      <ActionButton href={url} label="Przejdź do głosowania" />
      <Note>
        Oddanie głosu wymaga potwierdzenia linkiem wysłanym na ten adres email.
      </Note>
    </EmailLayout>
  );
}

import { ActionButton } from '@/lib/email/components/action-button';
import { EmailLayout } from '@/lib/email/components/email-layout';
import { greeting, Note, Paragraph } from '@/lib/email/components/email-text';

export const ACCOUNT_APPROVED_SUBJECT = 'Twoje konto zostało zatwierdzone';

interface Props {
  name?: string;
  url: string;
}

export function AccountApprovedEmail({ name, url }: Props) {
  return (
    <EmailLayout title={ACCOUNT_APPROVED_SUBJECT}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Administrator zatwierdził Twoje konto. Możesz teraz zalogować się do
        systemu.
      </Paragraph>
      <ActionButton href={url} label="Zaloguj się" />
      <Note>Dziękujemy za cierpliwość!</Note>
    </EmailLayout>
  );
}

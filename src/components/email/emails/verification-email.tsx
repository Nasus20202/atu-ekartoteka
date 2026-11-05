import { ActionButton } from '@/components/email/action-button';
import { EmailLayout } from '@/components/email/email-layout';
import { greeting, Note, Paragraph } from '@/components/email/email-text';

export const VERIFICATION_EMAIL_SUBJECT = 'Potwierdź swój adres email';

interface Props {
  name?: string;
  url: string;
}

export function VerificationEmail({ name, url }: Props) {
  return (
    <EmailLayout title={VERIFICATION_EMAIL_SUBJECT}>
      <Paragraph>{greeting(name, '!')}</Paragraph>
      <Paragraph>
        Dziękujemy za rejestrację. Aby dokończyć proces rejestracji, potwierdź
        swój adres email.
      </Paragraph>
      <ActionButton href={url} label="Potwierdź adres email" />
      <Note>Link wygaśnie za 24 godziny.</Note>
      <Note>
        Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj tę wiadomość.
      </Note>
    </EmailLayout>
  );
}

import { ActionButton } from '@/lib/email/components/action-button';
import { EmailLayout } from '@/lib/email/components/email-layout';
import { greeting, Note, Paragraph } from '@/lib/email/components/email-text';

export const PASSWORD_RESET_SUBJECT = 'Resetowanie hasła';

interface Props {
  name?: string;
  url: string;
}

export function PasswordResetEmail({ name, url }: Props) {
  return (
    <EmailLayout title={PASSWORD_RESET_SUBJECT}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Kliknij
        poniższy przycisk, aby ustawić nowe hasło:
      </Paragraph>
      <ActionButton href={url} label="Zresetuj hasło" />
      <Note>Link wygaśnie za 1 godzinę.</Note>
      <Note>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</Note>
    </EmailLayout>
  );
}

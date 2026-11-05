import { ActionButton } from '@/lib/email/components/action-button';
import { DetailsBox, StackedDetail } from '@/lib/email/components/details-box';
import { EmailLayout } from '@/lib/email/components/email-layout';
import { greeting, Note, Paragraph } from '@/lib/email/components/email-text';

export const ACCOUNT_ACTIVATION_TITLE = 'Twoje konto zostało utworzone';
export const ACCOUNT_ACTIVATION_SUBJECT =
  'Twoje konto zostało utworzone – ustaw nowe hasło';

interface Props {
  name?: string;
  email: string;
  tempPassword: string;
  url: string;
}

export function AccountActivationEmail({
  name,
  email,
  tempPassword,
  url,
}: Props) {
  return (
    <EmailLayout title={ACCOUNT_ACTIVATION_TITLE}>
      <Paragraph>{greeting(name)}</Paragraph>
      <Paragraph>
        Administrator utworzył dla Ciebie konto w systemie. Możesz zalogować się
        używając poniższych danych:
      </Paragraph>
      <DetailsBox>
        <StackedDetail label="Email" value={email} />
        <StackedDetail label="Tymczasowe hasło" value={tempPassword} last />
      </DetailsBox>
      <Paragraph>
        Po zalogowaniu zostaniesz poproszony o ustawienie nowego hasła.
      </Paragraph>
      <ActionButton href={url} label="Zaloguj się" />
      <Note>Jeśli nie spodziewałeś się tego maila, możesz go zignorować.</Note>
    </EmailLayout>
  );
}

import { ActionButton } from '@/components/email/action-button';
import { DetailsBox, InlineDetail } from '@/components/email/details-box';
import { EmailLayout } from '@/components/email/email-layout';
import { Note, Paragraph } from '@/components/email/email-text';

export const NEW_USER_ADMIN_TITLE = 'Nowa rejestracja użytkownika';
export const NEW_USER_ADMIN_SUBJECT =
  'Nowa rejestracja użytkownika - wymaga zatwierdzenia';

interface Props {
  userName: string;
  userEmail: string;
  registrationDate: string;
  url: string;
}

export function NewUserRegistrationAdminEmail({
  userName,
  userEmail,
  registrationDate,
  url,
}: Props) {
  return (
    <EmailLayout title={NEW_USER_ADMIN_TITLE}>
      <Paragraph>
        Nowy użytkownik zarejestrował się w systemie i oczekuje na
        zatwierdzenie.
      </Paragraph>
      <DetailsBox>
        <InlineDetail label="Imię i nazwisko" value={userName} />
        <InlineDetail label="Email" value={userEmail} />
        <InlineDetail label="Data rejestracji" value={registrationDate} />
      </DetailsBox>
      <Paragraph>
        Aby zatwierdzić lub odrzucić użytkownika, przejdź do panelu
        administracyjnego:
      </Paragraph>
      <ActionButton href={url} label="Otwórz panel administracyjny" />
      <Note>To jest automatyczna wiadomość. Nie odpowiadaj na ten email.</Note>
    </EmailLayout>
  );
}

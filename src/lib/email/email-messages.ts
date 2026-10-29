import {
  renderEmailTemplate,
  type TemplateName,
} from '@/lib/email/template-loader';

const DEFAULT_APP_URL = 'http://localhost:3000';

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

function appUrl(path: string): string {
  return `${process.env.APP_URL || DEFAULT_APP_URL}${path}`;
}

function greeting(name?: string): string {
  return name ? ` ${name}` : '';
}

function buildMessage(
  template: TemplateName,
  subject: string,
  variables: Record<string, string>
): EmailMessage {
  return {
    subject,
    html: renderEmailTemplate(template, 'html', variables),
    text: renderEmailTemplate(template, 'txt', variables),
  };
}

export function verificationMessage(
  token: string,
  name?: string
): EmailMessage {
  return buildMessage('verification-email', 'Potwierdź swój adres email', {
    NAME: greeting(name),
    VERIFICATION_URL: appUrl(`/verify-email?token=${token}`),
  });
}

export function passwordResetMessage(
  token: string,
  name?: string
): EmailMessage {
  return buildMessage('password-reset', 'Resetowanie hasła', {
    NAME: greeting(name),
    RESET_URL: appUrl(`/reset-password?token=${token}`),
  });
}

export function accountApprovedMessage(name?: string): EmailMessage {
  return buildMessage('account-approved', 'Twoje konto zostało zatwierdzone', {
    NAME: greeting(name),
    LOGIN_URL: appUrl('/login'),
  });
}

export function accountActivationMessage(
  tempPassword: string,
  name?: string
): EmailMessage {
  return buildMessage(
    'account-activation',
    'Twoje konto zostało utworzone – ustaw nowe hasło',
    {
      NAME: greeting(name),
      TEMP_PASSWORD: tempPassword,
      LOGIN_URL: appUrl('/login'),
    }
  );
}

export function newUserAdminMessage(
  userEmail: string,
  userName: string,
  registrationDate: string
): EmailMessage {
  return buildMessage(
    'new-user-registration-admin',
    'Nowa rejestracja użytkownika - wymaga zatwierdzenia',
    {
      USER_NAME: userName,
      USER_EMAIL: userEmail,
      REGISTRATION_DATE: registrationDate,
      ADMIN_URL: appUrl('/admin/users'),
    }
  );
}

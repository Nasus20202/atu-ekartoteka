import { render } from '@react-email/components';
import type { ReactElement } from 'react';

import {
  ACCOUNT_ACTIVATION_SUBJECT,
  AccountActivationEmail,
} from '@/lib/email/emails/account-activation';
import {
  ACCOUNT_APPROVED_SUBJECT,
  AccountApprovedEmail,
} from '@/lib/email/emails/account-approved';
import {
  NEW_USER_ADMIN_SUBJECT,
  NewUserRegistrationAdminEmail,
} from '@/lib/email/emails/new-user-registration-admin';
import {
  PASSWORD_RESET_SUBJECT,
  PasswordResetEmail,
} from '@/lib/email/emails/password-reset';
import {
  VERIFICATION_EMAIL_SUBJECT,
  VerificationEmail,
} from '@/lib/email/emails/verification-email';
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

async function buildMessage(
  template: TemplateName,
  subject: string,
  email: ReactElement,
  variables: Record<string, string>
): Promise<EmailMessage> {
  return {
    subject,
    html: await render(email),
    text: renderEmailTemplate(template, variables),
  };
}

export async function verificationMessage(
  token: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl(`/verify-email?token=${token}`);
  return buildMessage(
    'verification-email',
    VERIFICATION_EMAIL_SUBJECT,
    <VerificationEmail name={name} url={url} />,
    { NAME: greeting(name), VERIFICATION_URL: url }
  );
}

export async function passwordResetMessage(
  token: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl(`/reset-password?token=${token}`);
  return buildMessage(
    'password-reset',
    PASSWORD_RESET_SUBJECT,
    <PasswordResetEmail name={name} url={url} />,
    { NAME: greeting(name), RESET_URL: url }
  );
}

export async function accountApprovedMessage(
  name?: string
): Promise<EmailMessage> {
  const url = appUrl('/login');
  return buildMessage(
    'account-approved',
    ACCOUNT_APPROVED_SUBJECT,
    <AccountApprovedEmail name={name} url={url} />,
    { NAME: greeting(name), LOGIN_URL: url }
  );
}

export async function accountActivationMessage(
  email: string,
  tempPassword: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl('/login');
  return buildMessage(
    'account-activation',
    ACCOUNT_ACTIVATION_SUBJECT,
    <AccountActivationEmail
      name={name}
      email={email}
      tempPassword={tempPassword}
      url={url}
    />,
    {
      NAME: greeting(name),
      EMAIL: email,
      TEMP_PASSWORD: tempPassword,
      LOGIN_URL: url,
    }
  );
}

export async function newUserAdminMessage(
  userEmail: string,
  userName: string,
  registrationDate: string
): Promise<EmailMessage> {
  const url = appUrl('/admin/users');
  return buildMessage(
    'new-user-registration-admin',
    NEW_USER_ADMIN_SUBJECT,
    <NewUserRegistrationAdminEmail
      userName={userName}
      userEmail={userEmail}
      registrationDate={registrationDate}
      url={url}
    />,
    {
      USER_NAME: userName,
      USER_EMAIL: userEmail,
      REGISTRATION_DATE: registrationDate,
      ADMIN_URL: url,
    }
  );
}

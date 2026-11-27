import type { ReactElement } from 'react';
import { render, toPlainText } from 'react-email';

import {
  ACCOUNT_ACTIVATION_SUBJECT,
  AccountActivationEmail,
} from '@/components/email/emails/account-activation';
import {
  ACCOUNT_APPROVED_SUBJECT,
  AccountApprovedEmail,
} from '@/components/email/emails/account-approved';
import {
  NEW_USER_ADMIN_SUBJECT,
  NewUserRegistrationAdminEmail,
} from '@/components/email/emails/new-user-registration-admin';
import {
  PASSWORD_RESET_SUBJECT,
  PasswordResetEmail,
} from '@/components/email/emails/password-reset';
import {
  VERIFICATION_EMAIL_SUBJECT,
  VerificationEmail,
} from '@/components/email/emails/verification-email';
import {
  VOTE_CONFIRMATION_SUBJECT,
  VoteConfirmationEmail,
} from '@/components/email/emails/vote-confirmation';
import {
  VOTING_NOTIFICATION_SUBJECT,
  VotingNotificationEmail,
} from '@/components/email/emails/voting-notification';
import { appUrl } from '@/lib/platform/email/app-url';

const PLAIN_TEXT_OPTIONS: Parameters<typeof toPlainText>[1] = {
  selectors: [
    { selector: 'h1', options: { uppercase: false } },
    {
      selector: '[data-detail-label=true]',
      format: 'block',
      options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
    },
  ],
};

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

async function buildMessage(
  subject: string,
  email: ReactElement
): Promise<EmailMessage> {
  const html = await render(email);

  return { subject, html, text: toPlainText(html, PLAIN_TEXT_OPTIONS) };
}

export async function verificationMessage(
  token: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl(`/verify-email?token=${token}`);
  return buildMessage(
    VERIFICATION_EMAIL_SUBJECT,
    <VerificationEmail name={name} url={url} />
  );
}

export async function passwordResetMessage(
  token: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl(`/reset-password?token=${token}`);
  return buildMessage(
    PASSWORD_RESET_SUBJECT,
    <PasswordResetEmail name={name} url={url} />
  );
}

export async function accountApprovedMessage(
  name?: string
): Promise<EmailMessage> {
  const url = appUrl('/login');
  return buildMessage(
    ACCOUNT_APPROVED_SUBJECT,
    <AccountApprovedEmail name={name} url={url} />
  );
}

export async function accountActivationMessage(
  email: string,
  tempPassword: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl('/login');
  return buildMessage(
    ACCOUNT_ACTIVATION_SUBJECT,
    <AccountActivationEmail
      name={name}
      email={email}
      tempPassword={tempPassword}
      url={url}
    />
  );
}

export async function newUserAdminMessage(
  userEmail: string,
  userName: string,
  registrationDate: string
): Promise<EmailMessage> {
  const url = appUrl('/admin/users');
  return buildMessage(
    NEW_USER_ADMIN_SUBJECT,
    <NewUserRegistrationAdminEmail
      userName={userName}
      userEmail={userEmail}
      registrationDate={registrationDate}
      url={url}
    />
  );
}

export async function voteConfirmationMessage(
  code: string,
  votingTitle: string,
  validForMinutes: number,
  name?: string
): Promise<EmailMessage> {
  return buildMessage(
    VOTE_CONFIRMATION_SUBJECT,
    <VoteConfirmationEmail
      name={name}
      votingTitle={votingTitle}
      code={code}
      validForMinutes={validForMinutes}
    />
  );
}

export async function votingNotificationMessage(
  votingId: string,
  votingTitle: string,
  hoaName: string,
  endsAt?: string,
  name?: string
): Promise<EmailMessage> {
  const url = appUrl(`/dashboard/votings/${votingId}`);
  return buildMessage(
    VOTING_NOTIFICATION_SUBJECT,
    <VotingNotificationEmail
      name={name}
      votingTitle={votingTitle}
      hoaName={hoaName}
      endsAt={endsAt}
      url={url}
    />
  );
}

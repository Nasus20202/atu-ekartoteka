export const MAX_QUESTIONS = 20;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_QUESTION_LENGTH = 1000;

export const CONFIRMATION_TTL_MINUTES = 15;
/** At most one link per user in this window, like the email verification resend. */
export const CONFIRMATION_RATE_LIMIT_MINUTES = 5;

export const MAX_NOTIFICATION_RECIPIENTS = 500;

export const VOTING_PATHS = {
  admin: '/admin/votings',
  tenant: '/dashboard/votings',
  confirm: '/dashboard/votings/confirm',
} as const;

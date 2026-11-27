/**
 * Has an owner request the emailed ballot-confirmation link of a new voting.
 */

import { type APIRequestContext, expect, type Page } from '@playwright/test';

import { createVotingTenant } from './create-voting-tenant';
import { extractLink, loginWithTurnstile, waitForMail } from './mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './test-credentials';
import { answerQuestion, createDraftVoting, publishVoting } from './voting';

export const CONFIRMATION_SUBJECT = 'Potwierdź swój głos';
export const CONFIRM_PATH = '/dashboard/votings/confirm/';

interface RequestedLink {
  votingId: string;
  link: string;
}

/** Publishes a voting and has an owner request the emailed link, waiting at the email step. */
export async function requestLink(
  admin: Page,
  owner: Page,
  request: APIRequestContext
): Promise<RequestedLink> {
  const tenant = await createVotingTenant();
  await loginWithTurnstile(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  const votingId = await createDraftVoting(admin, {
    title: `Metryki E2E ${Date.now()}`,
    questions: ['Czy się zgadzasz?'],
  });
  await publishVoting(admin);

  await loginWithTurnstile(owner, tenant.email, tenant.password);
  await owner.goto(`/dashboard/votings/${votingId}`);
  await answerQuestion(owner, 1, 'Za');
  await owner.getByRole('button', { name: /Dalej/ }).click();
  await expect(owner.getByText('Sprawdź swoją skrzynkę email')).toBeVisible();

  const mail = await waitForMail(request, tenant.email, {
    subject: CONFIRMATION_SUBJECT,
  });
  return { votingId, link: extractLink(mail, CONFIRM_PATH) };
}

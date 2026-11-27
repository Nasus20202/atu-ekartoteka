/**
 * After the deadline owners cannot vote, but they see no results until the
 * admin shows them.
 */

import { expect, test } from '../fixtures';
import {
  countBallots,
  createDraftVoting,
  expireVotingDeadline,
  publishVoting,
  reopen,
  showVotingResults,
  tomorrowForDeadlineField,
} from '../utils/voting';

test('owners cannot vote after the deadline and see results only once shown', async ({
  adminPage,
  userPage,
}) => {
  test.slow();
  const title = `Termin E2E ${Date.now()}`;
  const votingId = await createDraftVoting(adminPage, {
    title,
    questions: ['Czy przedłużamy umowę?'],
    endsAt: tomorrowForDeadlineField(),
  });
  await publishVoting(adminPage);

  await userPage.goto(`/dashboard/votings/${votingId}`);
  await expect(userPage.getByText(/Termin:/)).toBeVisible();
  await expect(userPage.getByText('Twój głos')).toBeVisible();

  await expireVotingDeadline(votingId);

  // The deadline passed: no ballot form, no results, a clear explanation
  await reopen(userPage);
  await expect(userPage.getByText(/Zakończono:/)).toBeVisible();
  await expect(userPage.getByText(/Termin głosowania minął/)).toBeVisible();
  await expect(userPage.getByRole('button', { name: /Dalej/ })).toBeHidden();
  await expect(userPage.getByRole('progressbar')).toHaveCount(0);

  await userPage.goto('/dashboard/votings');
  const card = userPage.getByTestId(`voting-card-${votingId}`);
  await expect(card.getByText('Czeka na Twój głos')).toBeHidden();
  await expect(card.getByText(/Zakończono:/)).toBeVisible();
  expect(await countBallots(votingId)).toBe(0);

  // The admin still sees it as active until the status changes
  await reopen(adminPage);
  await expect(adminPage.getByText(/Zakończono:/)).toBeVisible();
  await expect(
    adminPage.getByRole('button', { name: 'Powiadom użytkowników' })
  ).toBeHidden();

  await showVotingResults(adminPage);
  await userPage.goto(`/dashboard/votings/${votingId}`);
  await expect(userPage.getByRole('progressbar').first()).toBeVisible();
});

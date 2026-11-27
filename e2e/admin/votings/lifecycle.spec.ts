/**
 * What changes for the admin and the owners from publishing a voting until it is
 * archived: a fixed ballot, a blocked abstention and a deadline.
 */

import { expect, login, test } from '../../fixtures';
import { createVotingTenant } from '../../utils/create-voting-tenant';
import {
  closeVoting,
  confirmAdminAction,
  countBallots,
  createDraftVoting,
  expireVotingDeadline,
  publishVoting,
  reopen,
  tomorrowForDeadlineField,
} from '../../utils/voting';

const NOT_FOUND = 'Strona nie znaleziona';
const ABSTAIN = 'Wstrzymał(a) się';

test('a published voting cannot be changed and an archived one is hidden', async ({
  adminPage,
  page,
}) => {
  const title = `Archiwum E2E ${Date.now()}`;
  const tenant = await createVotingTenant();
  const votingId = await createDraftVoting(adminPage, {
    title,
    questions: ['Czy zmieniamy regulamin?'],
  });
  await publishVoting(adminPage);

  // Neither the actions of a draft nor its meeting votes are offered
  await expect(
    adminPage.getByRole('button', { name: 'Zakończ głosowanie' })
  ).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Edytuj' })).toHaveCount(0);
  await expect(adminPage.getByRole('button', { name: 'Usuń' })).toHaveCount(0);
  await expect(
    adminPage.getByRole('form', { name: 'Nowy głos z zebrania' })
  ).toHaveCount(0);
  await adminPage.goto(`/admin/votings/${votingId}/edit`);
  await expect(adminPage.getByText(NOT_FOUND)).toBeVisible();

  await login(page, tenant.email, tenant.password);
  await page.goto('/dashboard/votings');
  const ownersCard = page.getByTestId(`voting-card-${votingId}`);
  await expect(ownersCard).toBeVisible();

  await adminPage.goto(`/admin/votings/${votingId}`);
  await confirmAdminAction(adminPage, 'Zarchiwizuj');
  await expect(adminPage.getByText('Zarchiwizowane').first()).toBeVisible();
  await expect(
    adminPage.getByRole('button', { name: 'Zarchiwizuj' })
  ).toHaveCount(0);
  // The results stay with the admin
  await expect(adminPage.getByRole('tab', { name: 'Wyniki' })).toBeVisible();

  await reopen(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Głosowania' })
  ).toBeVisible();
  await expect(ownersCard).toHaveCount(0);
  await page.goto(`/dashboard/votings/${votingId}`);
  await expect(page.getByText(NOT_FOUND)).toBeVisible();
});

test('owners cannot vote after the deadline and never see results', async ({
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

  await closeVoting(adminPage);
  await expect(adminPage.getByRole('progressbar').first()).toBeVisible();
  await userPage.goto(`/dashboard/votings/${votingId}`);
  await expect(
    userPage.getByText(/Głosowanie zostało zakończone/)
  ).toBeVisible();
  await expect(userPage.getByRole('progressbar')).toHaveCount(0);
});

test('owners cannot abstain in a voting that blocks it', async ({
  adminPage,
  userPage,
}) => {
  const votingId = await createDraftVoting(adminPage, {
    title: `Bez wstrzymania E2E ${Date.now()}`,
    questions: ['Czy wymieniamy windę?'],
    blockAbstain: true,
  });
  await expect(
    adminPage.getByText('Bez możliwości wstrzymania się')
  ).toBeVisible();
  await publishVoting(adminPage);

  await userPage.goto(`/dashboard/votings/${votingId}`);
  await expect(userPage.getByRole('radio', { name: 'Za' })).toBeVisible();
  await expect(userPage.getByRole('radio', { name: 'Przeciw' })).toBeVisible();
  await expect(userPage.getByRole('radio')).toHaveCount(2);

  await closeVoting(adminPage);
  await expect(adminPage.getByRole('progressbar')).toHaveCount(2);
  await expect(adminPage.getByText(ABSTAIN)).toBeHidden();
});

/**
 * Votes cast at a meeting: an admin enters them into a draft, and the owner of
 * the apartment sees them. A closed voting shows owners no results.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createVotingTenant } from '../utils/create-voting-tenant';
import { loginWithTurnstile } from '../utils/mock-server';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import {
  answerQuestion,
  closeVoting,
  createDraftVoting,
  publishVoting,
  reopen,
} from '../utils/voting';

const QUESTION = 'Czy wymieniamy domofon?';

async function enterBallot(
  page: Page,
  owner: string,
  number: string,
  choice: 'Za' | 'Przeciw'
) {
  const form = page.getByRole('form', { name: 'Nowy głos z zebrania' });
  await form.getByRole('button', { name: 'Lokal' }).click();
  await page.getByRole('combobox').fill(owner);
  // The list still shows other owners until the search has answered
  await page.getByRole('option', { name: `/${number} – ${owner}` }).click();
  await answerQuestion(page, 1, choice);
  await form.getByRole('button', { name: 'Zapisz głos' }).click();
}

test('an admin enters meeting votes and owners see no results', async ({
  page,
  browser,
}) => {
  test.slow();
  const tenant = await createVotingTenant(2);

  await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  const votingId = await createDraftVoting(page, {
    title: `Zebranie E2E ${Date.now()}`,
    questions: [QUESTION],
  });

  // The bar and the mobile menu mark the same link
  await expect(page.locator('nav a[aria-current="page"]')).toHaveText([
    'Głosowania',
    'Głosowania',
  ]);

  await enterBallot(page, tenant.name, 'V1', 'Przeciw');
  await expect(page.getByText('Wpisane głosy: 1')).toBeVisible();

  // A mistake can be removed while the voting is a draft
  await enterBallot(page, tenant.name, 'V2', 'Za');
  await expect(page.getByText('Wpisane głosy: 2')).toBeVisible();
  await page.getByRole('button', { name: /Usuń głos za lokal .*V2/ }).click();
  await page.getByRole('button', { name: 'Usuń głos', exact: true }).click();
  await expect(page.getByText('Wpisane głosy: 1')).toBeVisible();

  // The entered vote fixes what it answers
  await page.getByRole('link', { name: 'Edytuj' }).click();
  await expect(page.getByText(/są głosy z zebrania/)).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Treść pytania 1' })
  ).toBeDisabled();
  await page.goto(`/admin/votings/${votingId}`);
  await publishVoting(page);

  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  try {
    await loginWithTurnstile(owner, tenant.email, tenant.password);
    await owner.goto(`/dashboard/votings/${votingId}`);
    const meetingVote = owner.getByText(
      /V1: głos oddany na zebraniu i wpisany przez zarządcę/
    );
    await expect(meetingVote).toBeVisible();
    // The other apartment can still vote online
    await expect(owner.getByRole('button', { name: /Dalej/ })).toBeVisible();

    await reopen(page);
    await page.getByRole('tab', { name: 'Oddane głosy' }).click();
    await expect(
      page.getByText('Z zebrania').filter({ visible: true })
    ).toHaveCount(1);
    await closeVoting(page);
    await page.getByRole('tab', { name: 'Wyniki' }).click();
    await expect(page.getByRole('progressbar').first()).toBeVisible();

    await reopen(owner);
    await expect(
      owner.getByText(/Głosowanie zostało zakończone/)
    ).toBeVisible();
    await expect(meetingVote).toBeVisible();
    await expect(owner.getByRole('progressbar')).toHaveCount(0);
    await expect(owner.getByRole('button', { name: /Dalej/ })).toBeHidden();
  } finally {
    await ownerContext.close();
  }
});

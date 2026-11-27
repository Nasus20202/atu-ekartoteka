/** The tenant's votings: the navbar badge, the dashboard card and the ballot. */

import type { Page } from '@playwright/test';

import { expect, login, test } from '../fixtures';
import {
  createVotingTenant,
  type VotingTenant,
} from '../utils/create-voting-tenant';
import { openNavigationMenu } from '../utils/navigation';
import { seedOnlineBallot, seedVoting } from '../utils/seed-voting';
import { answerQuestion, apartmentBallot } from '../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../utils/voting-hoa';

const CAST = /Twój głos został oddany i potwierdzony/;
const QUESTIONS = ['Czy malujemy klatkę?', 'Czy sadzimy drzewa?'];

test.describe('Tenant votings', () => {
  let hoa: VotingHoa;
  let tenant: VotingTenant;

  // The badge counts every open voting of the owner, so none is shared
  test.beforeEach(async ({ page }) => {
    hoa = await createVotingHoa();
    tenant = await createVotingTenant(2, { hoaExternalId: hoa.externalId });
    await login(page, tenant.email, tenant.password);
  });

  test.afterEach(async () => {
    await deleteVotingHoa(hoa);
  });

  const voting = (title: string, status?: 'CLOSED') =>
    seedVoting(hoa, {
      title: `${title} E2E ${Date.now()}`,
      questions: QUESTIONS,
      status,
    });

  const castBoth = async (votingId: string) => {
    for (const apartment of ['V1', 'V2']) {
      await seedOnlineBallot(hoa, votingId, apartment, ['FOR', 'AGAINST']);
    }
  };

  const cardLink = (page: Page, votingId: string, name: string) =>
    page
      .getByTestId(`dashboard-voting-${votingId}`)
      .getByRole('link', { name });

  const badge = (page: Page) =>
    page
      .getByRole('status', { name: /czekające na Twój głos/ })
      .filter({ visible: true });

  /** The dashboard with the navbar's links shown, also behind the phone menu. */
  async function openDashboard(page: Page) {
    await page.goto('/dashboard');
    await openNavigationMenu(page);
    await expect(
      page
        .getByRole('navigation')
        .getByRole('link', { name: 'Głosowania' })
        .filter({ visible: true })
    ).toBeVisible();
  }

  test('the badge and the card wait until every apartment has voted', async ({
    page,
  }) => {
    const votingId = await voting('Licznik');
    await openDashboard(page);
    await expect(badge(page)).toHaveAccessibleName(/: 1$/);
    await expect(cardLink(page, votingId, 'Zagłosuj')).toBeVisible();

    await seedOnlineBallot(hoa, votingId, 'V1', ['FOR', 'FOR']);
    await openDashboard(page);
    await expect(badge(page)).toHaveAccessibleName(/: 1$/);
    await expect(cardLink(page, votingId, 'Zagłosuj')).toBeVisible();
    await page.goto(`/dashboard/votings/${votingId}`);
    await expect(page.getByText(/V1: Twój głos został oddany/)).toBeVisible();
    // Only the other apartment is still asked
    await expect(apartmentBallot(page, 'V2')).toBeVisible();
    await expect(apartmentBallot(page, 'V1')).toHaveCount(0);

    await seedOnlineBallot(hoa, votingId, 'V2', ['FOR', 'FOR']);
    await openDashboard(page);
    await expect(cardLink(page, votingId, 'Zobacz')).toBeVisible();
    await expect(badge(page)).toHaveCount(0);
  });

  test('each apartment answers for itself, and an unfinished one holds the form back', async ({
    page,
  }) => {
    const votingId = await voting('Formularz');
    await page.goto(`/dashboard/votings/${votingId}`);
    await expect(page.getByText(/Każdy lokal głosuje osobno/)).toBeVisible();
    const next = page.getByRole('button', { name: /Dalej/ });
    await expect(next).toBeDisabled();
    const first = apartmentBallot(page, 'V1');
    const second = apartmentBallot(page, 'V2');

    await answerQuestion(first, 1, 'Za');
    await answerQuestion(first, 2, 'Przeciw');
    await expect(next).toBeEnabled();
    await answerQuestion(second, 1, 'Przeciw');
    await expect(next).toBeDisabled();
    await second.getByRole('button', { name: 'Wyczyść' }).click();
    await expect(next).toBeEnabled();
  });

  test('a vote is final, and a closed voting leaves the dashboard', async ({
    page,
  }) => {
    const active = await voting('Oddane');
    const closed = await voting('Zakończone', 'CLOSED');
    await castBoth(active);
    await castBoth(closed);

    // Own answers, no form and no results
    await page.goto(`/dashboard/votings/${active}`);
    await expect(page.getByText(CAST)).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Dalej/ })).toBeHidden();
    await expect(page.getByRole('progressbar')).toHaveCount(0);

    await page.goto('/dashboard');
    await expect(cardLink(page, active, 'Zobacz')).toBeVisible();
    await expect(page.getByTestId(`dashboard-voting-${closed}`)).toHaveCount(0);

    await page.goto('/dashboard/votings');
    await page.getByTestId(`voting-card-${closed}`).getByRole('link').click();
    await expect(page.getByText(/Głosowanie zostało zakończone/)).toBeVisible();
    await expect(page.getByText(CAST)).toHaveCount(2);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });
});

/**
 * The metrics of admin write actions are exported after the actions ran: an
 * approval, an assignment to an existing account, a meeting ballot and a
 * deleted draft. Counters only grow, so one export that carries every point is
 * enough.
 */

import { expect, test } from '../fixtures';
import {
  approveWithApartment,
  createUser,
  openUsersPage,
  showAllUsers,
  userCard,
} from '../utils/admin-users';
import { assignExistingOwner } from '../utils/assign-existing-owner';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { createUserWithUnassignedApartment } from '../utils/create-user-with-unassigned-apartment';
import { createVotingTenant } from '../utils/create-voting-tenant';
import { loginWithTurnstile } from '../utils/mock-server';
import {
  hasMetricPoint,
  METRIC_EXPORT_TIMEOUT_MS,
  pollUntil,
} from '../utils/otlp';
import { listMetrics } from '../utils/otlp-capture';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import { createDraftVoting, enterMeetingBallot } from '../utils/voting';

const SECOND_MS = 1000;
const METRIC_TEST_MARGIN_MS = 100 * SECOND_MS;
const METRIC_TEST_TIMEOUT_MS = METRIC_EXPORT_TIMEOUT_MS + METRIC_TEST_MARGIN_MS;
const APARTMENT_SEARCH = 'ul. Testowa 1/2B';

const EXPECTED_POINTS: [string, Record<string, string>][] = [
  ['ekartoteka.auth.account_status', { status: 'approved' }],
  ['ekartoteka.auth.assignment', { result: 'success' }],
  ['ekartoteka.voting.meeting_ballot', { action: 'added' }],
  ['ekartoteka.voting.status_change', { status: 'deleted' }],
];

test.describe('OpenTelemetry admin action metrics', () => {
  // The flows share the export that the last test waits for
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(METRIC_TEST_TIMEOUT_MS);

  test('an approved account is counted', async ({ page }) => {
    const apartment = await createUniqueUnassignedApartment();
    const email = `otel-approve-${Date.now()}@e2e-test.com`;
    await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await openUsersPage(page);
    await createUser(page, email, 'Approve Metrics');
    await approveWithApartment(
      page,
      email,
      APARTMENT_SEARCH,
      apartment.externalOwnerId
    );
    await showAllUsers(page);
    await expect(
      userCard(page, email).getByText(/zatwierdzony/i)
    ).toBeVisible();
  });

  test('an apartment assigned to an existing account is counted', async ({
    page,
  }) => {
    const { email } = await createUserWithUnassignedApartment();
    await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await assignExistingOwner(page, email);

    await expect(page.getByText(/Przypisano \d+ mieszkań/i)).toBeVisible();
  });

  test('a meeting ballot is counted', async ({ page }) => {
    test.slow();
    const tenant = await createVotingTenant();
    await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await createDraftVoting(page, {
      title: `Zebranie metryki E2E ${Date.now()}`,
      questions: ['Czy?'],
    });

    await enterMeetingBallot(page, tenant.name, 'V1', 'Za');

    await expect(page.getByText('Wpisane głosy: 1')).toBeVisible();
  });

  test('a deleted draft is counted', async ({ page }) => {
    const title = `Usunięty szkic metryki E2E ${Date.now()}`;
    await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await createDraftVoting(page, { title, questions: ['Czy?'] });

    await page.getByRole('button', { name: 'Usuń' }).click();
    await page.getByRole('button', { name: 'Usuń' }).last().click();

    await expect(page).toHaveURL(/\/admin\/votings$/);
    await expect(page.getByText(title)).toBeHidden();
  });

  test('all admin action metrics are exported', async ({ request }) => {
    const metrics = await pollUntil(async () => {
      const captured = await listMetrics(request);
      return EXPECTED_POINTS.every(([name, attributes]) =>
        hasMetricPoint(captured, name, attributes)
      )
        ? captured
        : undefined;
    }, METRIC_EXPORT_TIMEOUT_MS);

    expect(metrics.length).toBeGreaterThan(0);
  });
});

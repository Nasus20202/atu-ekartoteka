/**
 * The voting metrics are exported after the voting flows ran: an admin takes a
 * voting through its lifecycle, the owner requests and confirms the emailed
 * link, and stale links are refused. Counters only grow, so one export that
 * carries every point is enough.
 */

import { expect, test } from '../fixtures';
import { loginWithTurnstile } from '../utils/mock-server';
import {
  hasMetricPoint,
  latestPointValue,
  METRIC_EXPORT_TIMEOUT_MS,
  pollUntil,
} from '../utils/otlp';
import { listMetrics } from '../utils/otlp-capture';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/test-credentials';
import { CONFIRM_PATH, requestLink } from '../utils/vote-link-request';
import {
  closeVoting,
  confirmAdminAction,
  createDraftVoting,
  expireVoteConfirmations,
  expireVotingDeadline,
  publishVoting,
} from '../utils/voting';
import {
  BALLOT,
  EXPECTED_POINTS,
  VOTING_COUNT,
  VOTING_STATUSES,
} from '../utils/voting-metric-points';

const SECOND_MS = 1000;
// Room for the flows before the export wait: the cap costs nothing when they are fast
const METRIC_TEST_MARGIN_MS = 100 * SECOND_MS;
const METRIC_TEST_TIMEOUT_MS = METRIC_EXPORT_TIMEOUT_MS + METRIC_TEST_MARGIN_MS;

const UNKNOWN_TOKEN = 'A'.repeat(43);
const UNUSABLE_LINK = /Ten link jest nieprawidłowy/;
const RATE_LIMIT_MESSAGE = /Poczekaj [1-5] min przed ponownym wysłaniem linku/;

test.describe('OpenTelemetry voting metrics', () => {
  // The flows share the export that the last test waits for
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(METRIC_TEST_TIMEOUT_MS);

  test('a voting is counted through its lifecycle', async ({ page }) => {
    await loginWithTurnstile(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await createDraftVoting(page, {
      title: `Cykl E2E ${Date.now()}`,
      questions: ['Czy?'],
    });
    await publishVoting(page);
    await closeVoting(page);
    await confirmAdminAction(page, 'Zarchiwizuj');
    await expect(
      page.getByRole('button', { name: 'Zarchiwizuj' })
    ).toBeHidden();
  });

  test('a notified owner requests, confirms and is refused with a link', async ({
    page,
    browser,
    request,
  }) => {
    test.slow();
    const ownerContext = await browser.newContext();
    const owner = await ownerContext.newPage();
    try {
      const { link } = await requestLink(page, owner, request);
      await owner.getByRole('button', { name: 'Wyślij link ponownie' }).click();
      await expect(owner.getByText(RATE_LIMIT_MESSAGE)).toBeVisible();

      await owner.goto(`${CONFIRM_PATH}${UNKNOWN_TOKEN}`);
      await expect(owner.getByText(UNUSABLE_LINK)).toBeVisible();

      await owner.goto(link);
      await owner.getByRole('button', { name: 'Potwierdź i zagłosuj' }).click();
      await expect(owner.getByText('Dziękujemy, głos oddany')).toBeVisible();
    } finally {
      await ownerContext.close();
    }
  });

  test('an expired link is counted as expired', async ({
    page,
    browser,
    request,
  }) => {
    test.slow();
    const ownerContext = await browser.newContext();
    const owner = await ownerContext.newPage();
    try {
      const { votingId, link } = await requestLink(page, owner, request);

      await expireVoteConfirmations(votingId);
      await owner.goto(link);
      await expect(owner.getByText(UNUSABLE_LINK)).toBeVisible();
    } finally {
      await ownerContext.close();
    }
  });

  test('a link is counted as closed once the deadline has passed', async ({
    page,
    browser,
    request,
  }) => {
    test.slow();
    const ownerContext = await browser.newContext();
    const owner = await ownerContext.newPage();
    try {
      const { votingId, link } = await requestLink(page, owner, request);

      await expireVotingDeadline(votingId);
      await owner.goto(link);
      await expect(owner.getByText(UNUSABLE_LINK)).toBeVisible();
    } finally {
      await ownerContext.close();
    }
  });

  test('all voting metrics are exported', async ({ request }) => {
    const metrics = await pollUntil(async () => {
      const captured = await listMetrics(request);
      const complete =
        EXPECTED_POINTS.every(([name, attributes]) =>
          hasMetricPoint(captured, name, attributes)
        ) &&
        VOTING_STATUSES.every(
          (status) =>
            latestPointValue(captured, VOTING_COUNT, { status }) !== undefined
        );
      return complete ? captured : undefined;
    }, METRIC_EXPORT_TIMEOUT_MS);

    for (const status of VOTING_STATUSES) {
      expect(
        latestPointValue(metrics, VOTING_COUNT, { status })
      ).toBeGreaterThanOrEqual(0);
    }
    expect(latestPointValue(metrics, BALLOT, {})).toBeGreaterThanOrEqual(1);
  });
});

/** Who may open a published voting: approved owners of its association only. */

import { expect, login, test } from '../../fixtures';
import { createVotingTenant } from '../../utils/create-voting-tenant';
import { createDraftVoting, publishVoting } from '../../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../../utils/voting-hoa';

test.describe('Voting access', () => {
  let hoa: VotingHoa;

  test.beforeAll(async () => {
    hoa = await createVotingHoa();
  });

  test.afterAll(async () => {
    await deleteVotingHoa(hoa);
  });

  test('is closed to other associations and unapproved accounts', async ({
    adminPage,
    page,
    browser,
  }) => {
    test.slow();
    const title = `Dostęp E2E ${Date.now()}`;
    // Of the shared test HOA, not of the voting's
    const foreign = await createVotingTenant();
    const pending = await createVotingTenant(1, {
      hoaExternalId: hoa.externalId,
      pending: true,
    });
    const votingId = await createDraftVoting(adminPage, {
      hoaName: hoa.externalId,
      title,
      questions: ['Czy się zgadzasz?'],
    });
    await publishVoting(adminPage);

    await login(page, foreign.email, foreign.password);
    await page.goto('/dashboard/votings');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Głosowania' })
    ).toBeVisible();
    await expect(page.getByTestId(`voting-card-${votingId}`)).toHaveCount(0);
    await page.goto(`/dashboard/votings/${votingId}`);
    await expect(page.getByText('Strona nie znaleziona')).toBeVisible();
    await expect(page.getByText(title)).toHaveCount(0);

    const context = await browser.newContext();
    const unapproved = await context.newPage();
    try {
      await login(unapproved, pending.email, pending.password);
      await unapproved.goto(`/dashboard/votings/${votingId}`);
      await expect(unapproved).toHaveURL(/\/dashboard$/);
      await expect(unapproved.getByText(title)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});

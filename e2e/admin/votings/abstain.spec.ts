/**
 * An admin can block abstaining for a whole voting.
 */

import { expect, test } from '../../fixtures';
import {
  closeVoting,
  createDraftVoting,
  publishVoting,
} from '../../utils/voting';

const ABSTAIN = 'Wstrzymał(a) się';

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

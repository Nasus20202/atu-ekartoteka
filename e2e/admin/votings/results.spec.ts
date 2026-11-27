/** Who voted what, and the counts: for the admin only. */

import { expect, test } from '../../fixtures';
import { createVotingTenant } from '../../utils/create-voting-tenant';
import { seedOnlineBallot, seedVoting } from '../../utils/seed-voting';
import { closeVoting } from '../../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../../utils/voting-hoa';

test.describe('Voting results', () => {
  let hoa: VotingHoa;

  test.beforeAll(async () => {
    hoa = await createVotingHoa();
  });

  test.afterAll(async () => {
    await deleteVotingHoa(hoa);
  });

  test('lists the voters and counts their answers', async ({ adminPage }) => {
    const tenant = await createVotingTenant(2, {
      hoaExternalId: hoa.externalId,
    });
    const votingId = await seedVoting(hoa, {
      title: `Wyniki E2E ${Date.now()}`,
      questions: ['Czy remontujemy dach?', 'Czy wybieramy firmę A?'],
    });
    await seedOnlineBallot(hoa, votingId, 'V1', ['FOR', 'AGAINST']);
    await seedOnlineBallot(hoa, votingId, 'V2', ['AGAINST', 'AGAINST']);

    await adminPage.goto(`/admin/votings/${votingId}`);
    await adminPage.getByRole('tab', { name: 'Oddane głosy' }).click();
    // The voters render as a card list and a table, only one is visible
    const shown = (text: string) =>
      adminPage.getByText(text).filter({ visible: true });
    await expect(shown(tenant.email)).toHaveCount(2);
    await expect(shown('1. Za')).toHaveCount(1);
    await expect(shown('1. Przeciw')).toHaveCount(1);
    await expect(shown('2. Przeciw')).toHaveCount(2);

    // The apartments split on the first question
    await closeVoting(adminPage);
    await adminPage.getByRole('tab', { name: 'Wyniki' }).click();
    await expect(adminPage.getByText('1 (50%)')).toHaveCount(2);
    await expect(adminPage.getByText('2 (100%)')).toHaveCount(1);
  });
});

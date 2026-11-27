/**
 * Votes cast at a meeting: what their owner sees, whom the notice of the
 * published voting preselects, and what can be edited once they are removed.
 */

import { expect, login, test } from '../../fixtures';
import {
  createVotingTenant,
  type VotingTenant,
} from '../../utils/create-voting-tenant';
import {
  createDraftVoting,
  enterMeetingBallot,
  publishVoting,
  reopen,
} from '../../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../../utils/voting-hoa';

const QUESTION = 'Czy wymieniamy domofon?';

test.describe('Meeting votes', () => {
  let hoa: VotingHoa;

  // The notice lists every owner of the association, so none is shared
  test.beforeEach(async () => {
    hoa = await createVotingHoa();
  });

  test.afterEach(async () => {
    await deleteVotingHoa(hoa);
  });

  const owner = (apartments: number) =>
    createVotingTenant(apartments, { hoaExternalId: hoa.externalId });

  const draft = (page: Parameters<typeof createDraftVoting>[0]) =>
    createDraftVoting(page, {
      hoaName: hoa.externalId,
      title: `Zebranie E2E ${Date.now()}`,
      questions: [QUESTION],
    });

  test('an owner sees a meeting vote and cannot cast it again', async ({
    adminPage,
    page,
  }) => {
    test.slow();
    const tenant = await owner(2);
    const votingId = await draft(adminPage);

    // The bar and the mobile menu mark the same link
    await expect(adminPage.locator('nav a[aria-current="page"]')).toHaveText([
      'Głosowania',
      'Głosowania',
    ]);
    await enterMeetingBallot(adminPage, tenant.name, 'V1', 'Przeciw');
    await expect(adminPage.getByText('Wpisane głosy: 1')).toBeVisible();
    await publishVoting(adminPage);

    await login(page, tenant.email, tenant.password);
    await page.goto(`/dashboard/votings/${votingId}`);
    const meetingVote = page.getByText(
      /V1: głos oddany na zebraniu i wpisany przez zarządcę/
    );
    await expect(meetingVote).toBeVisible();
    // The other apartment can still vote online
    await expect(page.getByRole('button', { name: /Dalej/ })).toBeVisible();

    await reopen(adminPage);
    await adminPage.getByRole('tab', { name: 'Oddane głosy' }).click();
    await expect(
      adminPage.getByText('Z zebrania').filter({ visible: true })
    ).toHaveCount(1);
  });

  test('the notice preselects the owners who still have to vote', async ({
    adminPage,
  }) => {
    const partly = await owner(2);
    const done = await owner(1);
    const waiting = await owner(1);
    await draft(adminPage);
    await enterMeetingBallot(adminPage, partly.name, 'V1', 'Za');
    await expect(adminPage.getByText('Wpisane głosy: 1')).toBeVisible();
    await enterMeetingBallot(adminPage, done.name, 'V1', 'Przeciw');
    await expect(adminPage.getByText('Wpisane głosy: 2')).toBeVisible();
    await publishVoting(adminPage);

    await adminPage
      .getByRole('button', { name: 'Powiadom użytkowników' })
      .click();
    const dialog = adminPage.getByRole('dialog');
    const box = ({ name }: VotingTenant) =>
      dialog.getByRole('checkbox', { name });
    const send = (count: number) =>
      dialog.getByRole('button', { name: `Wyślij (${count})` });

    await expect(box(partly)).toBeChecked();
    await expect(box(waiting)).toBeChecked();
    await expect(box(done)).not.toBeChecked();
    await expect(send(2)).toBeEnabled();
    const row = dialog.getByRole('listitem').filter({ hasText: partly.name });
    for (const number of ['V1', 'V2']) {
      await expect(row).toContainText(`/${number} – ${partly.name}`);
    }

    await dialog.getByRole('button', { name: 'Wszyscy' }).click();
    await expect(send(3)).toBeEnabled();
    await dialog.getByRole('button', { name: 'Bez głosu' }).click();
    await expect(box(done)).not.toBeChecked();
    await expect(send(2)).toBeEnabled();
  });

  test('removing every meeting vote unlocks the draft', async ({
    adminPage,
  }) => {
    const voter = await owner(1);
    await draft(adminPage);
    await enterMeetingBallot(adminPage, voter.name, 'V1', 'Za');
    await expect(adminPage.getByText('Wpisane głosy: 1')).toBeVisible();
    const question = adminPage.getByRole('textbox', {
      name: 'Treść pytania 1',
    });
    await adminPage.getByRole('link', { name: 'Edytuj' }).click();
    await expect(question).toBeDisabled();
    await adminPage.getByRole('link', { name: 'Anuluj' }).click();

    await adminPage
      .getByRole('button', { name: /Usuń głos za lokal .*V1/ })
      .click();
    await adminPage
      .getByRole('button', { name: 'Usuń głos', exact: true })
      .click();
    await expect(adminPage.getByText('Wpisane głosy: 1')).toBeHidden();
    await adminPage.getByRole('link', { name: 'Edytuj' }).click();

    await expect(adminPage.getByText(/są głosy z zebrania/)).toBeHidden();
    await expect(
      adminPage.getByRole('checkbox', { name: /Zablokuj odpowiedź/ })
    ).toBeEnabled();
    await question.fill('Czy wymieniamy bramę?');
    await adminPage.getByRole('button', { name: 'Zapisz zmiany' }).click();
    // Back on the draft: the edit form would show the new text before saving
    await expect(
      adminPage.getByRole('button', { name: 'Opublikuj' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('listitem').filter({ hasText: 'wymieniamy bramę' })
    ).toBeVisible();
  });
});

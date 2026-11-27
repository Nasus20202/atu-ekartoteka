/**
 * The admin narrows, orders and tabulates the list of votings.
 */

import { expect, test } from '../../fixtures';
import { chooseSearchedOption } from '../../utils/choose-searched-option';
import { createDraftVoting } from '../../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../../utils/voting-hoa';
import { waitForHydration } from '../../utils/wait-for-hydration';

test('filters, sorts and tabulates the votings', async ({ adminPage }) => {
  const prefix = `Lista E2E ${Date.now()}`;
  for (const title of [`${prefix} B`, `${prefix} A`]) {
    await createDraftVoting(adminPage, { title, questions: ['Czy?'] });
  }
  await adminPage.goto('/admin/votings');
  const state = adminPage.getByRole('button', { name: 'Filtr stanu' });
  await waitForHydration(state);

  await state.click();
  await adminPage
    .getByRole('menuitemradio', { name: 'Wersja robocza' })
    .click();
  await expect(adminPage).toHaveURL(/status=DRAFT/);

  await adminPage.getByRole('button', { name: 'Filtr wspólnoty' }).click();
  await chooseSearchedOption(
    adminPage.getByRole('combobox', { name: 'Szukaj wspólnoty' }),
    'Test HOA',
    adminPage.getByRole('option', { name: 'Test HOA', exact: true })
  );
  await expect(adminPage).toHaveURL(/hoa=/);

  await adminPage.getByRole('button', { name: 'Tabela' }).click();
  const table = adminPage.getByRole('table', { name: 'Głosowania' });
  await table.getByRole('button', { name: 'Tytuł' }).click();

  await expect(
    table.getByRole('columnheader', { name: 'Tytuł' })
  ).toHaveAttribute('aria-sort', 'ascending');
  const own = table.getByRole('row').filter({ hasText: prefix });
  await expect(own).toHaveText([/ A/, / B/]);
});

test.describe('Voting filters without a match', () => {
  let hoa: VotingHoa;

  // The list has to hold one voting only
  test.beforeEach(async () => {
    hoa = await createVotingHoa();
  });

  test.afterEach(async () => {
    await deleteVotingHoa(hoa);
  });

  test('offers to clear filters that match nothing', async ({ adminPage }) => {
    const title = `Filtry E2E ${Date.now()}`;
    await createDraftVoting(adminPage, {
      hoaName: hoa.externalId,
      title,
      questions: ['Czy?'],
    });
    const empty = adminPage.getByText('Brak pasujących głosowań');
    const listed = adminPage.getByText(title).filter({ visible: true });

    // An unknown status is ignored
    await adminPage.goto(`/admin/votings?hoa=${hoa.hoaId}&status=NIEZNANY`);
    await expect(listed).toBeVisible();

    await adminPage.goto(`/admin/votings?hoa=${hoa.hoaId}&status=CLOSED`);
    await expect(empty).toBeVisible();
    const clear = adminPage.getByRole('button', { name: 'Wyczyść filtry' });
    await waitForHydration(clear);
    await clear.click();

    await expect(adminPage).toHaveURL(/\/admin\/votings$/);
    await expect(empty).toBeHidden();
    await expect(listed).toBeVisible();
  });
});

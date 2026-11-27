/**
 * The admin narrows, orders and tabulates the list of votings.
 */

import { expect, test } from '../fixtures';
import { createDraftVoting } from '../utils/voting';
import { waitForHydration } from '../utils/wait-for-hydration';

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
  await adminPage
    .getByRole('combobox', { name: 'Szukaj wspólnoty' })
    .fill('Test HOA');
  await adminPage
    .getByRole('option', { name: 'Test HOA', exact: true })
    .click();
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

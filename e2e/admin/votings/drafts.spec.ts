/**
 * Drafts: what the form refuses and how it finds an association; an admin edits
 * and deletes them, and owners never see them.
 */

import { expect, test } from '../../fixtures';
import { createDraftVoting } from '../../utils/voting';
import {
  createVotingHoa,
  deleteVotingHoa,
  type VotingHoa,
} from '../../utils/voting-hoa';
import { waitForHydration } from '../../utils/wait-for-hydration';

const FIRST_QUESTION = 'Czy zgadzasz się na remont dachu?';

test('an admin edits and deletes a draft voting that owners cannot see', async ({
  adminPage,
  userPage,
}) => {
  const title = `Szkic E2E ${Date.now()}`;
  const editedTitle = `${title} (zmieniony)`;

  const votingId = await createDraftVoting(adminPage, {
    title,
    questions: [FIRST_QUESTION],
  });
  await expect(adminPage.getByText('Wersja robocza')).toBeVisible();

  // Owners get no list entry for a draft
  await userPage.goto('/dashboard/votings');
  await expect(userPage.getByText(title)).toBeHidden();

  await adminPage.getByRole('link', { name: 'Edytuj' }).click();
  await adminPage.getByLabel('Tytuł').fill(editedTitle);
  await adminPage.getByRole('button', { name: 'Zapisz zmiany' }).click();
  await expect(
    adminPage.getByRole('heading', { name: editedTitle })
  ).toBeVisible();

  await adminPage.getByRole('button', { name: 'Usuń' }).click();
  await adminPage.getByRole('button', { name: 'Usuń' }).last().click();
  await expect(adminPage).toHaveURL(/\/admin\/votings$/);
  await expect(adminPage.getByText(editedTitle)).toBeHidden();
  await adminPage.goto(`/admin/votings/${votingId}`);
  await expect(adminPage.getByText('Strona nie znaleziona')).toBeVisible();
});

test('an owner cannot open the voting admin area or a draft', async ({
  adminPage,
  userPage,
}) => {
  const title = `Prywatny szkic E2E ${Date.now()}`;
  const votingId = await createDraftVoting(adminPage, {
    title,
    questions: [FIRST_QUESTION],
  });

  await userPage.goto('/admin/votings');
  await expect(userPage).toHaveURL(/\/dashboard/);

  await userPage.goto(`/admin/votings/${votingId}`);
  await expect(userPage).toHaveURL(/\/dashboard/);

  await userPage.goto(`/dashboard/votings/${votingId}`);
  await expect(userPage.getByText(title)).toBeHidden();
  await expect(userPage.getByText('Strona nie znaleziona')).toBeVisible();
});

test.describe('The voting form', () => {
  let hoa: VotingHoa;

  // Its list has to be empty afterwards, so the association is its own
  test.beforeEach(async () => {
    hoa = await createVotingHoa();
  });

  test.afterEach(async () => {
    await deleteVotingHoa(hoa);
  });

  test('says what is missing and creates nothing until it is there', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/votings/new');
    const create = adminPage.getByRole('button', { name: 'Utwórz głosowanie' });
    const select = adminPage.getByLabel('Wspólnota');
    await waitForHydration(create);

    await create.click();
    // The select shows the same words, so the message is looked for in alerts
    const alert = (message: string) =>
      adminPage.getByRole('alert').filter({ hasText: message });
    await expect(alert('Wybierz wspólnotę')).toBeVisible();

    await select.click();
    await adminPage
      .getByRole('combobox', { name: 'Szukaj wspólnoty' })
      .fill(hoa.externalId.toLowerCase());
    await expect(
      adminPage.getByRole('option', { name: 'Test HOA', exact: true })
    ).toBeHidden();
    await expect(
      adminPage.getByRole('option', { name: hoa.externalId })
    ).toBeVisible();
    await adminPage.keyboard.press('Enter');
    await expect(select).toContainText(hoa.externalId);
    await expect(select).toBeFocused();

    await create.click();
    await expect(alert('Podaj tytuł głosowania')).toBeVisible();
    await adminPage.getByLabel('Tytuł').fill('Formularz E2E');
    await create.click();
    await expect(alert('Treść pytania nie może być pusta')).toBeVisible();
    await expect(adminPage).toHaveURL(/\/admin\/votings\/new$/);

    await adminPage.goto(`/admin/votings?hoa=${hoa.hoaId}`);
    await expect(adminPage.getByText('Brak pasujących głosowań')).toBeVisible();
  });
});

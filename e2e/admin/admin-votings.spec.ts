/**
 * Draft votings: an admin creates, edits and deletes them, and owners never see them.
 */

import { expect, test } from '../fixtures';
import { createDraftVoting } from '../utils/voting';

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

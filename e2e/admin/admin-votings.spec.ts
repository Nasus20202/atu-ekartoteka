/**
 * Draft votings: an admin creates, edits and deletes them, and owners never see them.
 */

import { expect, test } from '../fixtures';

const FIRST_QUESTION = 'Czy zgadzasz się na remont dachu?';

test('an admin edits and deletes a draft voting that owners cannot see', async ({
  adminPage,
  userPage,
}) => {
  const title = `Szkic E2E ${Date.now()}`;
  const editedTitle = `${title} (zmieniony)`;

  await adminPage.goto('/admin/votings/new');
  await adminPage.getByLabel('Wspólnota').click();
  await adminPage.getByRole('menuitemradio', { name: 'Test HOA' }).click();
  await adminPage.getByLabel('Tytuł').fill(title);
  await adminPage
    .getByRole('textbox', { name: 'Treść pytania 1' })
    .fill(FIRST_QUESTION);
  await adminPage.getByRole('button', { name: 'Utwórz głosowanie' }).click();
  await expect(adminPage.getByRole('heading', { name: title })).toBeVisible();
  await expect(adminPage.getByText('Wersja robocza')).toBeVisible();

  // Owners get a not-found page for it and no list entry
  await userPage.goto(
    adminPage.url().replace('/admin/votings/', '/dashboard/votings/')
  );
  await expect(userPage.getByText(title)).toBeHidden();
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
});

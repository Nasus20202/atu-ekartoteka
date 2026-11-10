/**
 * The public policy page and the admin editor behind it.
 * Serial: the policy is a global setting, so it must not change under other tests here.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { createMustChangePasswordUser } from '../utils/create-must-change-password-user';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import { setPrivacyPolicy } from '../utils/privacy-policy';

const NOT_PUBLISHED = 'Polityka prywatności nie została jeszcze opublikowana.';
const POLICY =
  '# Nasza polityka\n\nAdministratorem jest **Wspólnota Testowa**.';
const TEMPLATE_ONLY_TEXT = 'W skrócie';
const PLACEHOLDER_PATTERN = /\[\[[^\]]*\]\]/g;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  await setPrivacyPolicy(null);
  await createMustChangePasswordUser();
});

test.afterAll(async () => {
  await setPrivacyPolicy(null);
});

async function openEditor(adminPage: Page, button: string) {
  await adminPage.goto('/admin/settings');
  await adminPage.getByRole('button', { name: button }).click();
  return adminPage.getByRole('dialog', { name: 'Polityka prywatności' });
}

async function openEditTab(dialog: ReturnType<Page['getByRole']>) {
  await dialog.getByRole('tab', { name: 'Edycja' }).click();
  return dialog.getByLabel('Tekst polityki (Markdown)');
}

test.describe('Public policy page', () => {
  test('says nothing is published and never shows the template', async ({
    page,
  }) => {
    await page.goto('/privacy');

    await expect(page.getByText(NOT_PUBLISHED)).toBeVisible();
    await expect(page.getByText(TEMPLATE_ONLY_TEXT)).toHaveCount(0);
    await expect(
      page.getByRole('contentinfo').getByRole('link', {
        name: 'Polityka prywatności',
      })
    ).toBeVisible();
  });

  test('shows the saved text to a signed-out visitor without a redirect', async ({
    page,
  }) => {
    await setPrivacyPolicy(POLICY);

    await page.goto('/privacy');

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Nasza polityka' })
    ).toBeVisible();
    await expect(page.getByText('Wspólnota Testowa')).toBeVisible();
    await expect(page).toHaveTitle(/Polityka prywatności \| /);
  });

  test('shows the same text to a signed-in tenant', async ({ userPage }) => {
    await setPrivacyPolicy(POLICY);

    await userPage.goto('/privacy');

    await expect(
      userPage.getByRole('heading', { name: 'Nasza polityka' })
    ).toBeVisible();
  });

  test('stays reachable for a user who must change the password', async ({
    mustChangePasswordPage,
  }) => {
    await setPrivacyPolicy(POLICY);

    await mustChangePasswordPage.goto('/privacy');

    await expect(mustChangePasswordPage).toHaveURL(/\/privacy$/);
    await expect(
      mustChangePasswordPage.getByRole('heading', { name: 'Nasza polityka' })
    ).toBeVisible();
  });

  test('puts the footer under the content of a long policy', async ({
    page,
  }) => {
    const paragraphs = Array.from(
      { length: 80 },
      (_, index) => `Akapit ${index + 1} polityki prywatności.`
    );
    await setPrivacyPolicy(paragraphs.join('\n\n'));

    await page.goto('/privacy');
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();

    const last = await page.getByText('Akapit 80 polityki').boundingBox();
    const footer = await page.getByRole('contentinfo').boundingBox();
    expect(footer!.y).toBeGreaterThanOrEqual(last!.y + last!.height);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Policy editor', () => {
  test('starts from the template, rejects open placeholders and publishes', async ({
    adminPage,
    browser,
  }) => {
    await adminPage.goto('/admin/settings');
    await expect(adminPage.getByText('Nieopublikowana')).toBeVisible();

    const dialog = await openEditor(adminPage, 'Napisz politykę');
    await expect(
      dialog.getByText('Nie napisano jeszcze polityki prywatności.')
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Zacznij od szablonu' }).click();

    await expect(
      dialog.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();
    await expect(dialog.getByText(/Pola do uzupełnienia: \d+/)).toBeVisible();
    await expect(dialog.locator('mark').first()).toBeVisible();

    await dialog.getByRole('button', { name: 'Zapisz' }).click();
    await expect(
      dialog.getByText(/Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami/)
    ).toBeVisible();
    await expect(dialog).toBeVisible();

    const editor = await openEditTab(dialog);
    const filled = (await editor.inputValue()).replace(
      PLACEHOLDER_PATTERN,
      'Uzupełnione'
    );
    await editor.fill(filled);
    await dialog.getByRole('button', { name: 'Zapisz' }).click();

    await expect(adminPage.getByText('Zapisano ustawienia')).toBeVisible();
    await expect(adminPage.getByText('Opublikowana')).toBeVisible();
    await expect(dialog).toBeHidden();

    const visitor = await browser.newPage();
    await visitor.goto(new URL('/privacy', adminPage.url()).toString());
    await expect(
      visitor.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();
    await expect(visitor.getByText(TEMPLATE_ONLY_TEXT).first()).toBeVisible();
    await visitor.close();
  });

  test('opens a saved policy on the preview and clearing it unpublishes', async ({
    adminPage,
    page,
  }) => {
    await setPrivacyPolicy(POLICY);

    const dialog = await openEditor(adminPage, 'Edytuj');
    await expect(dialog.getByRole('tab', { name: 'Podgląd' })).toHaveAttribute(
      'data-state',
      'active'
    );
    await expect(
      dialog.getByRole('heading', { level: 1, name: 'Nasza polityka' })
    ).toBeVisible();

    const editor = await openEditTab(dialog);
    await expect(editor).toHaveValue(POLICY);
    await editor.fill('');
    await dialog.getByRole('button', { name: 'Zapisz' }).click();

    await expect(adminPage.getByText('Nieopublikowana')).toBeVisible();
    await page.goto('/privacy');
    await expect(page.getByText(NOT_PUBLISHED)).toBeVisible();
  });

  test('asks before discarding unsaved changes', async ({ adminPage }) => {
    await setPrivacyPolicy(POLICY);
    const dialog = await openEditor(adminPage, 'Edytuj');
    const editor = await openEditTab(dialog);
    await editor.fill(`${POLICY}\n\nDopisek.`);

    await dialog.getByRole('button', { name: 'Anuluj' }).click();
    const confirm = adminPage.getByRole('dialog', { name: 'Odrzucić zmiany?' });
    await expect(confirm).toBeVisible();

    await confirm.getByRole('button', { name: 'Odrzuć zmiany' }).click();

    await expect(dialog).toBeHidden();
    await adminPage.getByRole('button', { name: 'Edytuj' }).click();
    await expect(
      adminPage
        .getByRole('dialog', { name: 'Polityka prywatności' })
        .getByText('Dopisek.')
    ).toHaveCount(0);
  });

  test('asks before replacing existing text with the template', async ({
    adminPage,
  }) => {
    await setPrivacyPolicy(POLICY);
    const dialog = await openEditor(adminPage, 'Edytuj');

    await dialog.getByRole('button', { name: 'Wczytaj szablon' }).click();
    await adminPage
      .getByRole('dialog', { name: 'Zastąpić tekst szablonem?' })
      .getByRole('button', { name: 'Wczytaj szablon' })
      .click();

    await expect(dialog.getByText(TEMPLATE_ONLY_TEXT).first()).toBeVisible();
  });
});

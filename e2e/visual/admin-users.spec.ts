/**
 * Visual regression tests for the admin users list. The list is the most
 * data-dependent admin page, so it is checked with the fixed visual users,
 * including one with an email that has no spaces.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { userCard } from '../utils/admin-users';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import {
  VISUAL_MULTI_EMAIL,
  VISUAL_MULTI_NAME,
  VISUAL_PENDING_NAME,
} from '../utils/test-credentials';

async function showAllUsers(page: Page) {
  await page.getByRole('button', { name: 'Wszyscy', exact: true }).click();
  await expect(page.getByText(VISUAL_MULTI_NAME)).toBeVisible();
}

/** Opens a card action: a button on desktop, a menu item behind "Akcje" on mobile. */
async function openCardAction(page: Page, email: string, action: string) {
  const card = userCard(page, email);
  const inlineButton = card.getByRole('button', { name: action });
  if (await inlineButton.isVisible()) {
    await inlineButton.click();
    return;
  }
  await card.getByRole('button', { name: 'Akcje' }).click();
  await page.getByRole('menuitem', { name: action }).click();
}

test.describe('Visual: admin users', () => {
  test('pending users', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    await expect(visualAdminPage.getByText(VISUAL_PENDING_NAME)).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('pending.png', {
      fullPage: true,
    });
  });

  test('all users as cards', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    await showAllUsers(visualAdminPage);
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('all-cards.png', {
      fullPage: true,
    });
  });

  test('all users as a table', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    await showAllUsers(visualAdminPage);
    await visualAdminPage.getByRole('button', { name: 'Tabela' }).click();
    await expect(visualAdminPage.getByRole('table')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('all-table.png', {
      fullPage: true,
    });
  });

  test('all users as cards in dark mode', async ({ visualAdminPage }) => {
    await visualAdminPage.emulateMedia({ colorScheme: 'dark' });
    await visualAdminPage.goto('/admin/users');
    await showAllUsers(visualAdminPage);
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('all-cards-dark.png', {
      fullPage: true,
    });
  });

  test('create user dialog', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    // Cards on the mobile layout have icon-only "Akcje" buttons, the header one has text
    await visualAdminPage
      .getByRole('button', { name: 'Akcje' })
      .filter({ hasText: 'Akcje' })
      .click();
    await visualAdminPage
      .getByRole('menuitem', { name: 'Dodaj użytkownika' })
      .click();
    const dialog = visualAdminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog).toHaveScreenshot('create-user-dialog.png');
  });

  test('assign apartment dialog', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    await showAllUsers(visualAdminPage);
    await openCardAction(visualAdminPage, VISUAL_MULTI_EMAIL, 'Mieszkania');
    const dialog = visualAdminPage.getByRole('dialog');
    await expect(
      dialog.getByText('Przypisz mieszkanie', { exact: true })
    ).toBeVisible();
    await expect(dialog.getByRole('checkbox').first()).toBeVisible();

    await expect(dialog).toHaveScreenshot('assign-apartment-dialog.png');
  });

  test('reject confirmation dialog', async ({ visualAdminPage }) => {
    await visualAdminPage.goto('/admin/users');
    await showAllUsers(visualAdminPage);
    await openCardAction(visualAdminPage, VISUAL_MULTI_EMAIL, 'Zmień status');
    await visualAdminPage
      .getByRole('dialog')
      .getByRole('button', { name: 'Odrzucony' })
      .click();
    const confirm = visualAdminPage.getByRole('dialog', {
      name: 'Odrzuć użytkownika',
    });
    await expect(confirm).toBeVisible();

    await expect(confirm).toHaveScreenshot('reject-confirm-dialog.png');
  });
});

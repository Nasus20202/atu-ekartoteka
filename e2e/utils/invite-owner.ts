/**
 * Invite the owner of an unassigned apartment from the account management
 * page: select the apartment, confirm both steps and wait for the server action.
 */

import type { Page } from '@playwright/test';

import { openTestHoaCard } from './open-test-hoa';
import { isServerActionResponse } from './server-actions';

export async function inviteOwner(page: Page, apartmentId: string) {
  await page.goto('/admin/users/management');
  await openTestHoaCard(page);
  await page.locator(`#apt-${apartmentId}`).click();
  await page.getByRole('button', { name: /Zaproś użytkowników/i }).click();
  await page.getByRole('button', { name: 'Dalej' }).click();
  await Promise.all([
    page.waitForResponse(isServerActionResponse),
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Zaproś użytkowników' })
      .click(),
  ]);
}

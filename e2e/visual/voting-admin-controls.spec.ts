/**
 * Visual regression tests for the admin's voting controls: the table of the
 * list and the pickers of the form.
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import { waitForHydration } from '../utils/wait-for-hydration';

const ADMIN_VOTINGS = '/admin/votings';

test.describe('Visual: admin voting controls', () => {
  test('votings table', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(ADMIN_VOTINGS);
    const toggle = visualAdminPage.getByRole('button', { name: 'Tabela' });
    await waitForHydration(toggle);

    await toggle.click();
    await expect(
      visualAdminPage.getByRole('table', { name: 'Głosowania' })
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-votings-table.png', {
      fullPage: true,
    });
  });

  test('association search of the form', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/new`);
    const trigger = visualAdminPage.getByLabel('Wspólnota');
    await waitForHydration(trigger);

    await trigger.click();
    await expect(visualAdminPage.getByRole('option').first()).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot(
      'admin-voting-hoa-search.png'
    );
  });

  test('deadline picker of the form', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/new`);
    const trigger = visualAdminPage.getByLabel(/Termin zakończenia/);
    await waitForHydration(trigger);

    await trigger.click();
    // The clock is frozen, so the month and the marked day never change
    await visualAdminPage
      .getByRole('button', { name: '20 grudnia 2024' })
      .click();
    await expect(
      visualAdminPage.getByRole('textbox', { name: 'Godziny' })
    ).toHaveValue('23');
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot(
      'admin-voting-deadline-picker.png'
    );
  });
});

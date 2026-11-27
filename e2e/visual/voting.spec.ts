/**
 * Visual regression tests for the votings (see seed-visual-votings.ts)
 */

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import {
  VISUAL_VOTING_ACTIVE,
  VISUAL_VOTING_DRAFT,
  VISUAL_VOTING_RESULTS,
} from '../utils/seed-visual-votings';

const TENANT_VOTINGS = '/dashboard/votings';
const ADMIN_VOTINGS = '/admin/votings';

test.describe('Visual: tenant votings', () => {
  test('votings list', async ({ visualPage }) => {
    await visualPage.goto(TENANT_VOTINGS);
    await expect(visualPage.getByText('Aktywne głosowania')).toBeVisible();
    await expectNoHorizontalOverflow(visualPage);

    await expect(visualPage).toHaveScreenshot('votings-list.png', {
      fullPage: true,
    });
  });

  test('ballot of an owner who has not voted', async ({ visualPage }) => {
    await visualPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_ACTIVE}`);
    await expect(visualPage.getByText('Twój głos')).toBeVisible();
    await expectNoHorizontalOverflow(visualPage);

    await expect(visualPage).toHaveScreenshot('voting-ballot.png', {
      fullPage: true,
    });
  });

  test('ballot with answers chosen, in dark mode', async ({ visualPage }) => {
    await visualPage.emulateMedia({ colorScheme: 'dark' });
    await visualPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_ACTIVE}`);
    await visualPage
      .getByRole('group', { name: /^1\./ })
      .getByText('Za', { exact: true })
      .click();
    await visualPage
      .getByRole('group', { name: /^2\./ })
      .getByText('Przeciw', { exact: true })
      .click();

    await expect(visualPage).toHaveScreenshot('voting-ballot-dark.png', {
      fullPage: true,
    });
  });

  test('partly voted owner sees own answers and the remaining ballot', async ({
    visualMultiPage,
  }) => {
    await visualMultiPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_ACTIVE}`);
    await expect(
      visualMultiPage.getByText('Twój głos został oddany i potwierdzony')
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualMultiPage);

    await expect(visualMultiPage).toHaveScreenshot('voting-partly-voted.png', {
      fullPage: true,
    });
  });

  test('closed voting without results', async ({ visualPage }) => {
    await visualPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_RESULTS}`);
    await expect(
      visualPage.getByText(/Głosowanie zostało zakończone/)
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualPage);

    await expect(visualPage).toHaveScreenshot('voting-closed.png', {
      fullPage: true,
    });
  });

  test('closed voting in dark mode', async ({ visualPage }) => {
    await visualPage.emulateMedia({ colorScheme: 'dark' });
    await visualPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_RESULTS}`);
    await expect(
      visualPage.getByText(/Głosowanie zostało zakończone/)
    ).toBeVisible();

    await expect(visualPage).toHaveScreenshot('voting-closed-dark.png', {
      fullPage: true,
    });
  });

  test('a draft is not found for an owner', async ({ visualPage }) => {
    await visualPage.goto(`${TENANT_VOTINGS}/${VISUAL_VOTING_DRAFT}`);

    await expect(visualPage.getByText('Strona nie znaleziona')).toBeVisible();
  });
});

test.describe('Visual: admin votings', () => {
  test('votings list', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(ADMIN_VOTINGS);
    await expect(visualAdminPage.getByText('Wersja robocza')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-votings-list.png', {
      fullPage: true,
    });
  });

  test('new voting form', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/new`);
    await expect(visualAdminPage.getByText('Dane głosowania')).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-voting-form.png', {
      fullPage: true,
    });
  });

  test('draft with its actions', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/${VISUAL_VOTING_DRAFT}`);
    await expect(
      visualAdminPage.getByRole('button', { name: 'Opublikuj' })
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-voting-draft.png', {
      fullPage: true,
    });
  });

  test('active voting with results', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/${VISUAL_VOTING_ACTIVE}`);
    await expect(
      visualAdminPage.getByRole('progressbar').first()
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-voting-active.png', {
      fullPage: true,
    });
  });

  test('who voted what', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/${VISUAL_VOTING_RESULTS}`);
    await visualAdminPage.getByRole('tab', { name: 'Oddane głosy' }).click();
    await expect(
      visualAdminPage.getByText('visual@e2e-test.com').filter({ visible: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(visualAdminPage);

    await expect(visualAdminPage).toHaveScreenshot('admin-voting-voters.png', {
      fullPage: true,
    });
  });

  test('notify dialog', async ({ visualAdminPage }) => {
    await visualAdminPage.goto(`${ADMIN_VOTINGS}/${VISUAL_VOTING_ACTIVE}`);
    await visualAdminPage
      .getByRole('button', { name: 'Powiadom użytkowników' })
      .click();
    await expect(visualAdminPage.getByRole('dialog')).toBeVisible();

    await expect(visualAdminPage).toHaveScreenshot('admin-voting-notify.png');
  });
});

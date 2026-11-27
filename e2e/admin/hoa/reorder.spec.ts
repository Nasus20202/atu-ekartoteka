/**
 * Admin HOA list: reordering HOAs in a table, saved in the browser
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { TEST_HOA } from '../../utils/admin-apartments';
import {
  createReorderHoas,
  deleteReorderHoas,
  REORDER_HOA_FIRST,
  REORDER_HOA_SECOND,
} from '../../utils/reorder-hoas';
import { waitForHydration } from '../../utils/wait-for-hydration';

const REORDER_BUTTON = 'Zmień kolejność';
const ORDER_STORAGE_KEY = 'atu:hoa-order';
const DRAG_STEPS = 12;

let hoaIds: string[] = [];

test.beforeAll(async () => {
  hoaIds = await createReorderHoas();
});

test.afterAll(async () => {
  await deleteReorderHoas(hoaIds);
});

async function openFreshList(page: Page) {
  await page.goto('/admin/apartments');
  await page.evaluate(
    (key) => window.localStorage.removeItem(key),
    ORDER_STORAGE_KEY
  );
  // Not reload(): goto() waits for the streamed content
  await page.goto('/admin/apartments');
  await expect(
    page.getByRole('button', {
      name: `Zmień nazwę wspólnoty ${REORDER_HOA_FIRST}`,
    })
  ).toBeVisible();
  // Text typed or a drag started before this is dropped
  await waitForHydration(
    page.getByPlaceholder('Wyszukaj...').filter({ visible: true })
  );
}

function tableRows(page: Page) {
  return page
    .getByRole('table', { name: 'Kolejność wspólnot' })
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /^Przenieś wspólnotę/ }) });
}

function cardNames(page: Page) {
  return page.getByRole('button', { name: /^Zmień nazwę wspólnoty / });
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function startReordering(page: Page) {
  await page.getByRole('button', { name: REORDER_BUTTON }).click();
  await expect(
    page.getByRole('table', { name: 'Kolejność wspólnot' })
  ).toBeVisible();
}

/**
 * Mouse coordinates are viewport-relative, so centre the whole table first:
 * scrolling only the target row can leave the source row above the viewport.
 */
async function centreReorderTable(page: Page) {
  await page
    .getByRole('table', { name: 'Kolejność wspólnot' })
    .evaluate((table) => table.scrollIntoView({ block: 'center' }));
}

/** Both ends of a drag must be on screen before the mouse can reach them. */
async function expectOnScreen(page: Page, ...boxes: Box[]) {
  const viewport = page.viewportSize()!;
  for (const box of boxes) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
}

/**
 * The drag registers a move after the browser reports it, so releasing at once
 * can drop the HOA short of its target. Waits for the screen reader message.
 */
async function expectDraggedOver(page: Page, position: number) {
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: `jest nad pozycją ${position} z` })
  ).toBeAttached();
}

test.describe('Admin HOA reordering', () => {
  test('shows the HOAs in a table with a grip and position', async ({
    adminPage,
  }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);

    await expect(
      adminPage.getByText('Zmieniasz kolejność wspólnot.')
    ).toBeVisible();
    await expect(tableRows(adminPage).first()).toContainText(
      REORDER_HOA_SECOND
    );
    await expect(
      adminPage.getByRole('button', {
        name: `Przenieś wspólnotę ${REORDER_HOA_SECOND}`,
      })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: 'Przywróć domyślną' })
    ).toBeDisabled();
  });

  test('moves a HOA with the arrow buttons and keeps the order after reload', async ({
    adminPage,
  }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);

    await adminPage
      .getByRole('button', {
        name: `Przesuń wspólnotę ${REORDER_HOA_SECOND} niżej`,
      })
      .click();
    await expect(tableRows(adminPage).first()).toContainText(REORDER_HOA_FIRST);

    await adminPage.getByRole('button', { name: 'Gotowe' }).click();
    await expect(cardNames(adminPage).first()).toHaveAttribute(
      'aria-label',
      `Zmień nazwę wspólnoty ${REORDER_HOA_FIRST}`
    );

    await adminPage.reload();
    await expect(cardNames(adminPage).first()).toHaveAttribute(
      'aria-label',
      `Zmień nazwę wspólnoty ${REORDER_HOA_FIRST}`
    );
  });

  test('drags a HOA by its grip to a new position', async ({ adminPage }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);

    const grip = adminPage.getByRole('button', {
      name: `Przenieś wspólnotę ${REORDER_HOA_SECOND}`,
    });
    const target = tableRows(adminPage)
      .last()
      .getByRole('button', { name: /^Przenieś wspólnotę/ });
    await centreReorderTable(adminPage);
    const from = (await grip.boundingBox())!;
    const to = (await target.boundingBox())!;
    await expectOnScreen(adminPage, from, to);

    await adminPage.mouse.move(
      from.x + from.width / 2,
      from.y + from.height / 2
    );
    await adminPage.mouse.down();
    await adminPage.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 10, {
      steps: DRAG_STEPS,
    });
    await expectDraggedOver(adminPage, await tableRows(adminPage).count());
    await adminPage.mouse.up();

    await expect(tableRows(adminPage).last()).toContainText(REORDER_HOA_SECOND);
    await expect
      .poll(() =>
        adminPage.evaluate(
          (key) => window.localStorage.getItem(key),
          ORDER_STORAGE_KEY
        )
      )
      .toContain(hoaIds[1]);
  });

  test('moves a HOA with the keyboard', async ({ adminPage }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);

    await adminPage
      .getByRole('button', { name: `Przenieś wspólnotę ${REORDER_HOA_SECOND}` })
      .focus();
    await adminPage.keyboard.press('Space');
    await expect(
      adminPage.getByRole('status').filter({ hasText: 'jest nad pozycją 1' })
    ).toBeAttached();
    await adminPage.keyboard.press('ArrowDown');
    await expect(
      adminPage.getByRole('status').filter({ hasText: 'jest nad pozycją 2' })
    ).toBeAttached();
    await adminPage.keyboard.press('Space');

    await expect(tableRows(adminPage).first()).toContainText(REORDER_HOA_FIRST);
  });

  test('restores the default order', async ({ adminPage }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);
    await adminPage
      .getByRole('button', {
        name: `Przesuń wspólnotę ${REORDER_HOA_SECOND} niżej`,
      })
      .click();

    await adminPage.getByRole('button', { name: 'Przywróć domyślną' }).click();

    await expect(tableRows(adminPage).first()).toContainText(
      REORDER_HOA_SECOND
    );
    await expect(
      adminPage.getByRole('button', { name: 'Przywróć domyślną' })
    ).toBeDisabled();
  });

  test('hides the reorder button while a search is active', async ({
    adminPage,
  }) => {
    await openFreshList(adminPage);
    await expect(
      adminPage.getByRole('button', { name: REORDER_BUTTON })
    ).toBeVisible();

    // A streamed page can leave a hidden copy of its inputs in the DOM
    await adminPage
      .getByPlaceholder('Wyszukaj...')
      .filter({ visible: true })
      .fill(TEST_HOA);
    await adminPage
      .getByRole('button', { name: 'Szukaj' })
      .filter({ visible: true })
      .click();

    await expect(
      adminPage.getByRole('button', { name: REORDER_BUTTON })
    ).toBeHidden();
  });

  test('drags a row by its body, not only by the grip', async ({
    adminPage,
  }) => {
    await openFreshList(adminPage);
    await startReordering(adminPage);

    await centreReorderTable(adminPage);

    const first = tableRows(adminPage).first();
    const last = tableRows(adminPage).last();
    const from = (await first.getByText(REORDER_HOA_SECOND).boundingBox())!;
    const to = (await last.boundingBox())!;
    await expectOnScreen(adminPage, from, to);

    await adminPage.mouse.move(from.x + 5, from.y + from.height / 2);
    await adminPage.mouse.down();
    await adminPage.mouse.move(from.x + 5, to.y + to.height / 2 + 10, {
      steps: DRAG_STEPS,
    });
    await expectDraggedOver(adminPage, await tableRows(adminPage).count());
    await adminPage.mouse.up();

    await expect(tableRows(adminPage).last()).toContainText(REORDER_HOA_SECOND);
  });

  test('drags a card by its grip on the list and keeps the order after reload', async ({
    adminPage,
  }) => {
    await openFreshList(adminPage);

    const grips = adminPage.getByRole('button', {
      name: /^Przenieś wspólnotę/,
    });
    const from = (await grips.first().boundingBox())!;
    const to = (await grips.nth(1).boundingBox())!;

    await adminPage.mouse.move(
      from.x + from.width / 2,
      from.y + from.height / 2
    );
    await adminPage.mouse.down();
    await adminPage.mouse.move(
      to.x + to.width / 2 + 40,
      to.y + to.height / 2 + 10,
      {
        steps: DRAG_STEPS,
      }
    );
    await expectDraggedOver(adminPage, 2);
    await adminPage.mouse.up();

    await expect(cardNames(adminPage).nth(1)).toHaveAttribute(
      'aria-label',
      `Zmień nazwę wspólnoty ${REORDER_HOA_SECOND}`
    );
    await adminPage.reload();
    await expect(cardNames(adminPage).nth(1)).toHaveAttribute(
      'aria-label',
      `Zmień nazwę wspólnoty ${REORDER_HOA_SECOND}`
    );
  });
});

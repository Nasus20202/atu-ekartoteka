/**
 * Expand the test HOA card on the account management page, found by its id.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import * as pg from 'pg';

import { TEST_HOA } from './admin-apartments';
import { loadSql } from './load-sql';

async function findTestHoaId(): Promise<string> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const result = await client.query<{ id: string }>(
      loadSql('select-hoa-id-by-external-id.sql'),
      [TEST_HOA]
    );
    const hoa = result.rows[0];
    if (!hoa)
      throw new Error(`HOA ${TEST_HOA} not found, run global seed first`);
    return hoa.id;
  } finally {
    await client.end();
  }
}

// Short lists fit on the first API page and render no sentinel at all, so the
// scroll below must never wait on it longer than a single load.
const SENTINEL_SCROLL_TIMEOUT_MS = 2000;

/** The HOA list loads more HOAs as the sentinel scrolls into view, so keep scrolling until the card is rendered. */
async function revealCard(page: Page, card: Locator): Promise<void> {
  const sentinel = page.getByTestId('infinite-scroll-sentinel');
  await expect(async () => {
    if ((await card.count()) > 0) return;

    // The list may still be loading and the sentinel may never appear, so retry
    // the whole check instead of blocking until the test times out.
    if ((await sentinel.count()) === 0)
      throw new Error('HOA card not loaded yet');

    await sentinel.scrollIntoViewIfNeeded({
      timeout: SENTINEL_SCROLL_TIMEOUT_MS,
    });
    throw new Error('HOA card not loaded yet');
  }).toPass();
}

export async function openTestHoaCard(page: Page): Promise<void> {
  const card = page.getByTestId(`hoa-card-${await findTestHoaId()}`);
  await revealCard(page, card);
  await card.click();
}

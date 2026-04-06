/**
 * Financial summary API tests
 * Tests the GET /api/admin/hoa/[hoaId]/financial-summary endpoint directly.
 */

import { expect, test } from '../fixtures';

test.describe('Financial Summary API', () => {
  test('returns totalClosingBalance and totalChargesDue for TEST01 HOA', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/apartments');
    await expect(adminPage.getByText('TEST01')).toBeVisible();

    // Get the TEST01 HOA id from the HOA list API
    const hoaResponse = await adminPage.evaluate(async () => {
      const res = await fetch('/api/admin/hoa?search=TEST01');
      return res.json();
    });

    const hoa = (
      hoaResponse.homeownersAssociations as Array<{
        id: string;
        externalId: string;
      }>
    ).find((h) => h.externalId === 'TEST01');
    expect(hoa).toBeDefined();

    const summaryResponse = await adminPage.evaluate(async (hoaId: string) => {
      const res = await fetch(`/api/admin/hoa/${hoaId}/financial-summary`);
      return { status: res.status, body: await res.json() };
    }, hoa!.id);

    expect(summaryResponse.status).toBe(200);
    const body = summaryResponse.body as Record<string, unknown>;

    // The seeded HOA has payments and charge notifications
    expect(body).toHaveProperty('totalClosingBalance');
    expect(body).toHaveProperty('totalChargesDue');
    expect(typeof body.totalClosingBalance).toBe('number');
    expect(typeof body.totalChargesDue).toBe('number');

    // Seeded payment has closingBalance = -444.25; charge notifications total = 444.25
    expect(body.totalClosingBalance).toBe(-444.25);
    expect(Number(body.totalChargesDue)).toBeGreaterThan(0);
  });

  test('returns zero balances for HOA with no apartments', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/apartments');

    // Use a random UUID that won't match any HOA — the route returns 200 with zeros
    const response = await adminPage.evaluate(async () => {
      const res = await fetch(
        '/api/admin/hoa/00000000-0000-0000-0000-000000000000/financial-summary'
      );
      return { status: res.status, body: await res.json() };
    });

    // Route returns 200 with zero values when no apartments found
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalClosingBalance: 0,
      totalChargesDue: 0,
    });
  });
});

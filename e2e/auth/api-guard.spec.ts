/**
 * API guard tests: protected routes resolve the caller through the shared
 * guards, so an anonymous request is rejected with 401 and a signed-in tenant
 * with 403 instead of being treated as an admin by omission.
 */

import { expect, test } from '../fixtures';

test.describe('API auth guard', () => {
  test('anonymous request to an admin route is rejected with 401', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/stats');

    expect(response.status()).toBe(401);
  });

  test('tenant request to an admin route is rejected with 403', async ({
    userPage,
  }) => {
    const response = await userPage.request.get('/api/admin/stats');

    expect(response.status()).toBe(403);
  });

  test('admin request to an admin route is accepted', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/admin/stats');

    expect(response.status()).toBe(200);
  });

  test('anonymous request to a tenant route is rejected with 401', async ({
    request,
  }) => {
    const response = await request.post('/api/resend-verification');

    expect(response.status()).toBe(401);
  });
});

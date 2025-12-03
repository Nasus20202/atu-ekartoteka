/**
 * Admin user management tests
 */

import { expect, test } from '../fixtures';
import { USER_EMAIL } from '../utils/test-credentials';

test.describe('Admin User Management', () => {
  test('admin can view users list', async ({ adminPage }) => {
    // Navigate and wait for network to be idle
    await adminPage.goto('/admin/users', { waitUntil: 'networkidle' });

    // Wait for page to load
    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    // Click "Wszyscy" (All) tab to see all users and wait for response
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Wszyscy/i }).click(),
    ]);

    // Wait for the loading to finish and user to appear
    await expect(adminPage.getByText(USER_EMAIL)).toBeVisible({
      timeout: 10000,
    });
  });

  test('admin can create a new user', async ({ adminPage }) => {
    // Navigate and wait for network to be idle
    await adminPage.goto('/admin/users', { waitUntil: 'networkidle' });

    // Click add user button
    await adminPage.getByRole('button', { name: /Dodaj użytkownika/i }).click();

    // Fill in user form
    const uniqueEmail = `newuser-${Date.now()}@e2e-test.com`;
    await adminPage.getByLabel('Email *').fill(uniqueEmail);
    await adminPage.getByLabel('Hasło *').fill('NewUserPassword123!');
    await adminPage.getByLabel('Imię i nazwisko').fill('New Test User');

    // Submit
    await adminPage.getByRole('button', { name: /Utwórz/i }).click();

    // Wait for modal to close
    await expect(
      adminPage.getByText('Dodaj nowego użytkownika')
    ).not.toBeVisible({
      timeout: 10000,
    });

    // User should appear in the list
    await expect(adminPage.getByText(uniqueEmail)).toBeVisible();
  });

  test('admin can assign apartment to user', async ({ adminPage }) => {
    // Navigate to users page
    await adminPage.goto('/admin/users', { waitUntil: 'networkidle' });

    // Click "Wszyscy" (All) tab to see all users
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Wszyscy/i }).click(),
    ]);

    // Find the seeded user card
    await expect(adminPage.getByText(USER_EMAIL)).toBeVisible({
      timeout: 10000,
    });

    // Click "Mieszkania" button to manage apartments
    await adminPage.getByRole('button', { name: /Mieszkania/i }).click();

    // Should see the apartment management dialog
    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).toBeVisible({
      timeout: 10000,
    });

    // The seeded user already has an apartment selected - verify it's shown
    await expect(adminPage.getByText(/ul\. Testowa 1\/1A/i)).toBeVisible();
  });
});

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

  test('admin can create and accept a new user', async ({ adminPage }) => {
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

    // Find the newly created user card (should be pending with no apartment)
    const newUserCard = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: uniqueEmail });
    await expect(newUserCard).toBeVisible({
      timeout: 10000,
    });

    // Click "Zatwierdź" button to approve the user
    await newUserCard.getByRole('button', { name: /Zatwierdź/i }).click();

    // Should see the approval dialog
    await expect(adminPage.getByText(/Zatwierdź konto/i)).toBeVisible({
      timeout: 10000,
    });

    // Select first available apartment from the list
    const firstApartmentCheckbox = adminPage.getByRole('checkbox').first();
    await firstApartmentCheckbox.click();

    // Submit approval and wait for API response
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage
        .getByRole('button', { name: /Zatwierdź/i })
        .nth(1)
        .click(),
    ]);

    // Wait for dialog to close - if it closes without error, approval was successful
    await expect(adminPage.getByText(/Zatwierdź konto/i)).not.toBeVisible({
      timeout: 10000,
    });

    // Click "Wszyscy" to see all users
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Wszyscy/i }).click(),
    ]);

    // Verify user is approved
    await expect(newUserCard.getByText(/zatwierdzony/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify user has 1 apartment assigned
    await expect(
      newUserCard.getByText(/Przypisane mieszkania: 1/i)
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('admin can view apartments for a specific user', async ({
    adminPage,
  }) => {
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
    const userCard = adminPage
      .locator('.text-card-foreground')
      .filter({ hasText: USER_EMAIL });
    await expect(userCard).toBeVisible({
      timeout: 10000,
    });

    // Click "Mieszkania" button within the specific user card
    await userCard.getByRole('button', { name: /Mieszkania/i }).click();

    // Should see the apartment management dialog
    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).toBeVisible({
      timeout: 10000,
    });

    // The seeded user already has an apartment selected - verify it's shown
    await expect(adminPage.getByText(/ul\. Testowa 1\/1A/i)).toBeVisible();
  });
});

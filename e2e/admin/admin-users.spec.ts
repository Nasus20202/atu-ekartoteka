/**
 * Admin user management tests
 */

import { expect, test } from '../fixtures';
import { createUniqueUnassignedApartment } from '../utils/create-unique-unassigned-apartment';
import { USER_EMAIL } from '../utils/test-credentials';

test.describe.serial('Admin User Management', () => {
  test('admin can view users list', async ({ adminPage }) => {
    // Navigate to users page
    await adminPage.goto('/admin/users');

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
    // Seed a unique unassigned apartment so the approval dialog has something to assign
    await createUniqueUnassignedApartment();

    // Navigate to users page
    await adminPage.goto('/admin/users');

    // Wait for page to load
    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    // Click add user button (inside "Akcje" dropdown)
    await adminPage.getByRole('button', { name: /Akcje/i }).click();
    await adminPage
      .getByRole('menuitem', { name: /Dodaj użytkownika/i })
      .click();

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

    // Click "Zatwierdź" inline button on the new user card (desktop viewport)
    await newUserCard.getByRole('button', { name: /^Zatwierdź$/i }).click();

    // Should see the approval dialog
    await expect(adminPage.getByText(/Zatwierdź konto/i)).toBeVisible({
      timeout: 10000,
    });

    // Search for the unassigned apartment and select it
    await adminPage.getByLabel(/Przypisz mieszkanie/i).fill('ul. Testowa 1/2B');
    const firstApartmentCheckbox = adminPage.getByRole('checkbox').first();
    await expect(firstApartmentCheckbox).toBeEnabled({ timeout: 5000 });
    await firstApartmentCheckbox.click();

    // Submit approval and wait for API response
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage
        .locator('.fixed.inset-0')
        .getByRole('button', { name: /Zatwierdź/i })
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

  test('admin can search for a user by email', async ({ adminPage }) => {
    await adminPage.goto('/admin/users');

    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

    // Switch to all users so seeded user is visible
    await Promise.all([
      adminPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/admin/users') && resp.status() === 200
      ),
      adminPage.getByRole('button', { name: /Wszyscy/i }).click(),
    ]);

    // Type in the search box
    const searchInput = adminPage.getByPlaceholder(
      /Szukaj po imieniu, emailu lub mieszkaniu/i
    );
    await searchInput.fill(USER_EMAIL);

    // Wait for the debounced API call
    await adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/users') &&
        resp.url().includes('search=') &&
        resp.status() === 200
    );

    // Seeded user should still be visible
    await expect(adminPage.getByText(USER_EMAIL)).toBeVisible({
      timeout: 5000,
    });

    // Searching for something that matches nothing should show empty state
    await searchInput.fill('nikt-taki-nie-istnieje@example.com');

    await adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/users') &&
        resp.url().includes('search=') &&
        resp.status() === 200
    );

    await expect(
      adminPage.getByText(
        /Nie znaleziono użytkowników pasujących do wyszukiwania/i
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('admin can view apartments for a specific user', async ({
    adminPage,
  }) => {
    // Navigate to users page
    await adminPage.goto('/admin/users');

    // Wait for page to load
    await expect(
      adminPage.getByRole('heading', { name: /Użytkownicy/i })
    ).toBeVisible();

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

    // Click "Mieszkania" inline button on the user card (desktop viewport)
    await userCard.getByRole('button', { name: /Mieszkania/i }).click();

    // Should see the apartment management dialog
    await expect(adminPage.getByText(/Przypisz mieszkanie/i)).toBeVisible({
      timeout: 10000,
    });

    // The seeded user already has an apartment selected - verify it's shown
    await expect(adminPage.getByText(/ul\. Testowa 1\/1A/i)).toBeVisible();
  });
});

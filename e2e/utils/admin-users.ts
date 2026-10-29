import { expect, type Page } from '@playwright/test';

const LOAD_TIMEOUT_MS = 10000;

function isUsersResponse(url: string, status: number) {
  return url.includes('/api/admin/users') && status === 200;
}

export async function openUsersPage(page: Page) {
  await page.goto('/admin/users');
  await expect(
    page.getByRole('heading', { name: /Użytkownicy/i })
  ).toBeVisible();
}

/** Switches the list to all users and waits for it to reload. */
export async function showAllUsers(page: Page) {
  await Promise.all([
    page.waitForResponse((resp) => isUsersResponse(resp.url(), resp.status())),
    page.getByRole('button', { name: /Wszyscy/i }).click(),
  ]);
}

/** Opens the users page with every status listed. */
export async function openAllUsers(page: Page) {
  await openUsersPage(page);
  await showAllUsers(page);
}

export function userCard(page: Page, email: string) {
  return page.locator('.text-card-foreground').filter({ hasText: email });
}

/** Types into the user search and waits for the debounced request. */
export async function searchUsers(page: Page, term: string) {
  await page
    .getByPlaceholder(/Szukaj po imieniu, emailu lub mieszkaniu/i)
    .fill(term);
  await page.waitForResponse(
    (resp) =>
      isUsersResponse(resp.url(), resp.status()) &&
      resp.url().includes('search=')
  );
}

/** Creates a pending user through the "Dodaj użytkownika" dialog. */
export async function createUser(page: Page, email: string, name: string) {
  await page.getByRole('button', { name: /Akcje/i }).click();
  await page.getByRole('menuitem', { name: /Dodaj użytkownika/i }).click();

  await page.getByLabel('Email *').fill(email);
  await page.getByLabel('Hasło *').fill('NewUserPassword123!');
  await page.getByLabel('Imię i nazwisko').fill(name);
  await page.getByRole('button', { name: /Utwórz/i }).click();

  await expect(page.getByText('Dodaj nowego użytkownika')).not.toBeVisible({
    timeout: LOAD_TIMEOUT_MS,
  });
}

/** Approves a pending user and assigns the apartment found by the search. */
export async function approveWithApartment(
  page: Page,
  email: string,
  search: string,
  apartmentText: string
) {
  await userCard(page, email)
    .getByRole('button', { name: /^Zatwierdź$/i })
    .click();
  await expect(page.getByText(/Zatwierdź konto/i)).toBeVisible({
    timeout: LOAD_TIMEOUT_MS,
  });

  await page.getByLabel(/Przypisz mieszkanie/i).fill(search);
  const apartmentOption = page
    .locator('label')
    .filter({ hasText: apartmentText });
  await expect(apartmentOption).toBeVisible({ timeout: 5000 });
  await apartmentOption.click();

  await Promise.all([
    page.waitForResponse((resp) => isUsersResponse(resp.url(), resp.status())),
    page
      .locator('.fixed.inset-0')
      .getByRole('button', { name: /Zatwierdź/i })
      .click(),
  ]);
  await expect(page.getByText(/Zatwierdź konto/i)).not.toBeVisible({
    timeout: LOAD_TIMEOUT_MS,
  });
}

export const APP_NAME = 'ATU Ekartoteka';

export function formatDocumentTitle(pageTitle: string): string {
  return `${pageTitle} | ${APP_NAME}`;
}

export const PAGE_TITLE_TEMPLATE = formatDocumentTitle('%s');

export const PAGE_TITLES = {
  login: 'Logowanie',
  register: 'Rejestracja',
  forgotPassword: 'Przywracanie hasła',
  resetPassword: 'Ustaw nowe hasło',
  verifyEmail: 'Weryfikacja email',
  changePassword: 'Zmiana hasła',
  profile: 'Profil',
  charges: 'Naliczenia',
  chargesFallback: 'Naliczenia mieszkania',
  payments: 'Wpłaty',
  paymentsFallback: 'Wpłaty mieszkania',
  hoaList: 'Wspólnoty mieszkaniowe',
  hoaApartmentsFallback: 'Mieszkania wspólnoty',
  apartment: 'Lokal',
  importData: 'Import danych',
  settings: 'Ustawienia',
  users: 'Użytkownicy',
  accountManagement: 'Zarządzanie kontami',
  notFound: 'Strona nie znaleziona',
  appError: 'Coś poszło nie tak!',
  chargesError: 'Wystąpił błąd',
} as const;

/** "Naliczenia - <label>" for the owner, the generic title otherwise. */
export function formatChargesTitle(label: string | null): string {
  return label
    ? `${PAGE_TITLES.charges} - ${label}`
    : PAGE_TITLES.chargesFallback;
}

/** "Wpłaty <year> - <label>" for the owner, the generic title otherwise. */
export function formatPaymentsYearTitle(
  year: number | null,
  label: string | null
): string {
  if (year === null || !label) return PAGE_TITLES.paymentsFallback;
  return `${PAGE_TITLES.payments} ${year} - ${label}`;
}

/** "Lokal <number> - <HOA name>" for the admin apartment page. */
export function formatAdminApartmentTitle(
  number: string,
  hoaName: string
): string {
  return `${PAGE_TITLES.apartment} ${number} - ${hoaName}`;
}

/**
 * Title for a segment that has nested segments. A plain string would drop
 * the app template for them, so the object form keeps it.
 */
export function nestedTitle(pageTitle: string) {
  return { default: pageTitle, template: PAGE_TITLE_TEMPLATE };
}

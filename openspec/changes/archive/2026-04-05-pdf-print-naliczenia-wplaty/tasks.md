## 1. Dependency Setup

- [x] 1.1 Install `@react-pdf/renderer` via pnpm and verify compatibility with React 19
- [x] 1.2 Download or source a Roboto TTF font file (Latin + Latin-Extended) and place it in `public/fonts/Roboto-Regular.ttf`

## 2. PDF Infrastructure

- [x] 2.1 Create `src/lib/pdf/register-fonts.ts` that registers the Roboto font with `@react-pdf/renderer` once at module level
- [x] 2.2 Create `src/components/pdf/primitives.tsx` with reusable styled `View`, `Text`, and `Page` wrappers (header row, data row, section title, etc.)

## 3. Charge PDF Document

- [x] 3.1 Create `src/components/pdf/charge-pdf-document.tsx` that accepts `ChargeDisplay[]` and apartment/HOA metadata as props and renders a PDF document with: HOA and apartment header, charge line items grouped by billing period (description, quantity, unit, unit price, total), and period subtotals
- [x] 3.2 Verify all Polish characters (ą, ę, ś, ó, ł, ż, ź, ć, ń) render correctly in the charge PDF

## 4. Payment PDF Document

- [x] 4.1 Create `src/components/pdf/payment-pdf-document.tsx` that accepts the payment record and apartment metadata as props and renders a PDF document with: apartment address and year header, opening balance, monthly table (Miesiąc, Wpłaty, Naliczenia, Saldo), and closing balance
- [x] 4.2 Verify all Polish characters render correctly in the payment PDF

## 5. Tenant Charge Detail Page Integration

- [x] 5.1 Add a lazy download handler to `src/app/dashboard/charges/[apartmentId]/page.tsx` that imports `@react-pdf/renderer` and `ChargePdfDocument` on click, generates a blob, and triggers browser download with the filename `naliczenia-{apartmentAddress}-{date}.pdf`
- [x] 5.2 Add a "Drukuj / Pobierz PDF" button to the tenant charges detail page (disabled/loading state while PDF is generating)

## 6. Tenant Payment Detail Page Integration

- [x] 6.1 Add a lazy download handler to `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` that imports the PDF renderer and `PaymentPdfDocument` on click and triggers download with the filename `wplaty-{apartmentAddress}-{year}.pdf`
- [x] 6.2 Add a "Drukuj / Pobierz PDF" button to the tenant payment detail page (disabled/loading state while PDF is generating)

## 7. Admin Apartment Detail Page Integration

- [x] 7.1 Add a lazy download handler and "Drukuj / Pobierz PDF" button to the "Naliczenia" card in `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx` that downloads all charges for the apartment using the filename `naliczenia-{apartmentAddress}-{date}.pdf`
- [x] 7.2 Add a lazy download handler and "Drukuj / Pobierz PDF" button to each payment year section in the "Historia wpłat" card on the same page, downloading that year's payment record using the filename `wplaty-{apartmentAddress}-{year}.pdf`

## 8. Tests

- [x] 8.1 Write a unit test (`src/components/pdf/__tests__/charge-pdf-document.test.tsx`) that renders `ChargePdfDocument` with sample data and asserts it resolves without errors
- [x] 8.2 Write a unit test (`src/components/pdf/__tests__/payment-pdf-document.test.tsx`) that renders `PaymentPdfDocument` with sample data and asserts it resolves without errors
- [x] 8.3 Write an E2E test (`e2e/pdf-download.spec.ts`) that: logs in as a tenant, navigates to a charge detail page, clicks "Drukuj / Pobierz PDF", and asserts a PDF file is downloaded; then navigates to a payment detail page, clicks the button, and asserts a PDF file is downloaded
- [x] 8.4 Extend the E2E test to: log in as an admin, navigate to an apartment detail page, click "Drukuj / Pobierz PDF" in the Naliczenia card and assert a PDF is downloaded, then click the button in a payment year section and assert a PDF is downloaded

## 9. Quality Checks

- [x] 9.1 Run `pnpm lint` and fix any ESLint errors
- [x] 9.2 Run `pnpm test` (Vitest) and ensure all unit tests pass
- [x] 9.3 Run the E2E suite and ensure the PDF download tests pass
- [x] 9.4 Verify `pnpm build` succeeds with no type errors

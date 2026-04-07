## 1. Database Migrations

- [x] 1.1 Add `header String?`, `footer String?`, `apartmentsDataDate DateTime?`, `chargesDataDate DateTime?`, `notificationsDataDate DateTime?` to `HomeownersAssociation` in `prisma/schema.prisma` and run `prisma migrate dev --name add-hoa-header-footer-and-wmb-dates`
- [x] 1.2 Add `openingDebt Float @default(0)` and `openingSurplus Float @default(0)` to `Payment` in `prisma/schema.prisma` and run `prisma migrate dev --name add-payment-opening-debt-surplus`

## 2. Import — Parser Fixes

- [x] 2.1 Fix `parsePowCzynszFile` in `src/lib/parsers/pow-czynsz-parser.ts`: apply `.replace(',', '.')` to `quantity` and `unitPrice` fields before `parseFloat`
- [x] 2.2 Fix `parsePowCzynszFile` header/footer extraction to use the two standalone `#` separator lines as delimiters (lines before first `#` = header, lines between first and second `#` = footer)
- [x] 2.3 Add unit tests for `parsePowCzynszFile` in `src/lib/parsers/__tests__/pow-czynsz-parser.test.ts` covering: float parsing of quantity/unitPrice, header extraction, footer extraction

## 3. Import — WMB Files Per Data Type

- [x] 3.1 Add `apartmentsWmbFile?: File`, `chargesWmbFile?: File`, `notificationsWmbFile?: File` to `ImportFileGroup` in `src/lib/import/types.ts`
- [x] 3.2 Update `groupFilesByHOA` in `src/lib/import/utils.ts` to route `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, `pow_czynsz_ost_wys.wmb` to their respective typed fields
- [x] 3.3 Add `parseWmbDate(buffer: Buffer): Promise<Date | undefined>` utility in `src/lib/import/utils.ts` that parses a `YYYYMMDD` string to a `Date` (midnight UTC), returning `undefined` on failure
- [x] 3.4 In `importSingleHOA` (`src/lib/import/import-handler.ts`): parse WMB dates from all three files and write `apartmentsDataDate`, `chargesDataDate`, `notificationsDataDate` to the HOA record inside the transaction
- [x] 3.5 Add `apartmentsDataDate?: Date`, `chargesDataDate?: Date`, `notificationsDataDate?: Date` to `HOAImportResult` in `src/lib/import/types.ts` and populate from parsed WMB dates
- [x] 3.6 Add unit tests for `parseWmbDate` and `groupFilesByHOA` WMB routing in `src/lib/import/__tests__/utils.test.ts`

## 4. Import — HOA Header/Footer Persistence

- [x] 4.1 In `importNotifications` (`src/lib/import/importers/notifications.ts`): after upsert logic, call `tx.homeownersAssociation.update` to write `header` and `footer` (joined lines, or `null` if empty) from `notificationData.header/footer`
- [x] 4.2 Pass `header` and `footer` from `parsePowCzynszFile` result through `importSingleHOA` to `importNotifications`

## 5. Import — Validation

- [x] 5.1 Add `NAL_AMOUNT_TOLERANCE` and `WPLATY_BALANCE_TOLERANCE` constants (both `0.01`) to `src/lib/import/constants.ts` (create file if it doesn't exist)
- [x] 5.2 Add `validateNalCzynsz` function in `src/lib/import/validators.ts`: checks `totalAmount ≈ quantity × unitPrice` per entry; returns array of error strings
- [x] 5.3 Add `validateWplaty` function in `src/lib/import/validators.ts`: checks `closingBalance ≈ openingBalance + totalPayments − totalCharges` per entry; returns array of error strings
- [x] 5.4 Call both validators in `importSingleHOA` before the Prisma transaction; if any errors exist, push them to `result.errors` and return early without entering the transaction
- [x] 5.5 Add unit tests for `validateNalCzynsz` and `validateWplaty` in `src/lib/import/__tests__/validators.test.ts`

## 6. Import — Payment openingDebt/openingSurplus

- [x] 6.1 Expose `openingDebt` and `openingSurplus` on `PaymentEntry` in `src/lib/parsers/wplaty-parser.ts` (already parsed as fields 6 and 7, just add to the returned object)
- [x] 6.2 Write `openingDebt` and `openingSurplus` to the DB in `importPayments` (`src/lib/import/importers/payments.ts`)

## 7. Apartment Sorting — Natural Order

- [x] 7.1 Replace the sort comparator in `src/app/api/admin/apartments/route.ts` with a natural sort using `localeCompare` with `{ numeric: true }` for both `building` and `number`
- [x] 7.2 Apply the same natural sort comparator to the client-side apartment sort in `src/app/admin/users/page.tsx`
- [x] 7.3 Add unit tests for the natural sort comparator in `src/app/api/admin/apartments/__tests__/sort.test.ts`

## 8. Unassigned Apartments API — isActive Field

- [x] 8.1 Include `isActive` in the apartment fields returned by `GET /api/admin/unassigned-apartments`
- [x] 8.2 Add `isActive: boolean` to the `UnassignedApartment` type in `src/app/admin/users/management/HoaCard.tsx`

## 9. Bulk Creation — Inactive Apartment Safeguard

- [x] 9.1 In `HoaCard.tsx`: render apartments with `isActive === false` with muted styling and a "Nieaktywny" badge; make the label non-interactive by default (checkbox disabled, click captured on the row)
- [x] 9.2 Add an `AlertDialog` (shadcn/ui) in `HoaCard.tsx` triggered when the admin clicks an inactive apartment row, with title "Nieaktywne mieszkanie", body text, and "Anuluj" / "Tak, utwórz konto" actions
- [x] 9.3 On confirmation, add the inactive apartment's ID to the selection via `onToggleApartment`; on cancel, do nothing

## 10. Payment Table — Bilans Otwarcia Real Values

- [x] 10.1 In `src/components/payment-table.tsx`: replace `-` placeholders in the Bilans otwarcia row with `payment.openingSurplus` (Wpłaty column) and `payment.openingDebt` (Naliczenia column), formatted with `.toFixed(2) zł`
- [x] 10.2 Apply the same fix to the Bilans otwarcia row in `src/components/pdf/payment-pdf-document.tsx`
- [x] 10.3 Ensure `openingDebt` and `openingSurplus` are included in the `Payment` type used by these components (update type definitions if needed)

## 11. Payment Table — Opening Balance Colour Coding

- [x] 11.1 In `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`: apply `text-red-600` / `text-green-600` conditional classes to the `Saldo początkowe` display value based on sign
- [x] 11.2 Apply the same colour coding in `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx`

## 12. Payment Table — Wpłaty to Naliczenia Link

- [x] 12.1 In `src/components/payment-table.tsx`: wrap each month row's Naliczenia cell value in a Next.js `<Link>` pointing to `/dashboard/charges/[apartmentId]?month=YYYY-MM`
- [x] 12.2 The charges page (`src/app/dashboard/charges/[apartmentId]/page.tsx`) reads the `month` query param and auto-expands or scrolls to that period

## 13. Charges Page — Collapsible Year/Month Navigation

- [x] 13.1 In `src/app/dashboard/charges/[apartmentId]/page.tsx`: group periods by year and wrap in shadcn/ui `Accordion` with one `AccordionItem` per year, each containing the month period cards
- [x] 13.2 Apply the same collapsible year grouping to the multi-apartment charges page (`src/app/dashboard/charges/page.tsx`)

## 14. HOA Header in Charge Notifications

- [x] 14.1 Ensure the HOA `header` field is fetched alongside charge notification data in the relevant queries (include `apartment.homeownersAssociation.header`)
- [x] 14.2 In `src/components/dashboard/notifications-sidebar.tsx`: render the HOA `header` text above notification items when non-null
- [x] 14.3 In `src/components/dashboard/charge-notifications-card.tsx`: render the HOA `header` text above notification items when non-null

## 15. Admin User List — Full Apartment Data

- [x] 15.1 Extend the API query for the admin user list to include all required apartment fields: `address`, `building`, `number`, `postalCode`, `city`, `shareNumerator`, `shareDenominator`, `externalOwnerId`, `externalApartmentId`, `isActive`
- [x] 15.2 In the user card component in `src/app/admin/users/page.tsx`: display the full apartment details (address line, ownership share when present, external IDs, isActive badge)

## 16. Admin Import UI — WMB Dates and Validation Errors

- [x] 16.1 In the import result card (`src/app/admin/import/page.tsx`): display `apartmentsDataDate`, `chargesDataDate`, `notificationsDataDate` per HOA result when present, formatted as a readable date
- [x] 16.2 Ensure import validation errors (from validators) surface in the per-HOA result card error list in the UI

## 17. HOA Financial Summary

- [x] 17.1 Create `GET /api/admin/hoa/[hoaId]/financial-summary` route returning `{ totalClosingBalance, totalChargesDue }` aggregated from `Payment` (most recent year per apartment) and `ChargeNotification` tables
- [x] 17.2 In `src/app/admin/apartments/page.tsx`: fetch and display the financial summary per HOA card showing total closing balance and total charges due

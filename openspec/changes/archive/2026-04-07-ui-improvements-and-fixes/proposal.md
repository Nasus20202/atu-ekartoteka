## Why

Several areas of the ATU Ekartoteka admin panel and tenant portal have usability gaps, missing validations, and absent features that tenants and administrators need for day-to-day HOA management. These issues have accumulated across the charges, payments, import, notifications, and user management flows and should be addressed together as a cohesive UX improvement batch.

## What Changes

- **Naliczenia period navigation**: Replace flat period list with collapsible year/month dropdowns so long histories are navigable.
- **Bilans otwarcia — real wpłaty/naliczenia values**: The "Bilans otwarcia" row in the payment table currently shows `-` for the Wpłaty and Naliczenia columns. These should display the actual opening debt (`openingDebt`) and opening surplus (`openingSurplus`) values parsed from `wplaty.txt` (fields 6 and 7). Both fields must be stored in the `Payment` DB model and rendered in the table and PDF. **BREAKING** (DB migration required).
- **Opening balance colouring**: Display `Saldo początkowe` in red (negative) or green (positive/zero) to immediately communicate financial standing.
- **Wpłaty → Naliczenia link**: Each month row in the payments detail view gains a direct link to the charges (naliczenia) for that specific month.
- **Import validation**: Validate `nal_czynsz.txt` (line totals: `totalAmount = quantity × unitPrice`) and `wplaty.txt` (balance identity: `closingBalance = openingBalance + totalPayments − totalCharges`). Errors abort the HOA import and are surfaced in the admin UI before any data reaches the database.
- **WMB files tracked per data type**: The three `.wmb` files (`lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, `pow_czynsz_ost_wys.wmb`) each correspond to a specific data type (apartments, charges, notifications). They are currently accepted but not associated to a type. `ImportFileGroup` must track them per type so their data-as-of date can be shown per entity in the admin import panel.
- **HOA header/footer — saved on import, updated on reimport**: Parse header and footer text from `pow_czynsz.txt` (text blocks before and between the two standalone `#` separator lines) and persist them to the `HomeownersAssociation` DB record during notification import. On reimport, the fields are overwritten with the latest values. Display the header in charge notification views.
- **Charge notification amounts — fix parser**: `quantity` and `unitPrice` in `pow_czynsz.txt` use Polish comma decimals (e.g. `45,89`, `1,2300`) but are parsed without comma→dot replacement, truncating to integers in the DB. Fix the parser; existing records self-correct on next reimport.
- **User list: apartment data columns**: Extend each user card in the admin user listing to show full apartment details: address, building, number, postal code, city, ownership share (`shareNumerator`/`shareDenominator`), external owner ID, external apartment ID, and active status (`isActive`).
- **Mathematical apartment sorting**: Sort apartments by building and number using numeric/natural sort, not lexicographic string comparison. **BREAKING** (changes existing sort order).
- **Bulk account creation: inactive apartment handling**: Inactive apartments (`isActive === false`) are visually disabled in the bulk-create picker. Clicking one shows a confirmation dialog before adding it to the selection, preventing accidental invitations for stale apartments.
- **Per-HOA financial summary**: Add an aggregate view showing total balance across all apartments and total amount due per HOA.

## Capabilities

### New Capabilities

- `db-migration`: All database schema migrations MUST preserve existing data. Migrations use additive changes (new nullable columns with defaults) or explicit data backfill steps. Destructive migrations (dropping columns, changing types) require a documented backfill plan executed before the destructive step.

### Modified Capabilities

- `charges-and-payments`: Bilans otwarcia real values, opening balance colour coding, wpłaty→naliczenia link, charge notification exact amounts (no rounding), period collapsible navigation, HOA header displayed in charge notifications.
- `data-import`: Import validation for `nal_czynsz.txt` (line totals) and `wplaty.txt` (closing balance identity), WMB files tracked per data type with date display per entity in admin panel, HOA header/footer parsed from `pow_czynsz.txt`, saved to DB during notification import, and updated on reimport.
- `hoa-management`: Per-HOA financial summary (total closing balance and total charges due).
- `user-management`: Full apartment data in user cards, inactive apartment safeguard with confirmation dialog in bulk creation.
- `apartment-management`: Mathematical (natural) apartment sorting.

## Impact

- **UI**: `src/app/dashboard/charges/`, `src/app/dashboard/payments/`, `src/app/admin/users/`, `src/app/admin/apartments/`, `src/app/admin/import/`
- **Components**: `src/components/charges/period-card.tsx`, `src/components/dashboard/notifications-sidebar.tsx`, `src/components/dashboard/charge-notifications-card.tsx`, `src/components/payment-table.tsx`
- **API**: `src/app/api/admin/apartments/route.ts` (sort change), new HOA financial summary endpoint
- **DB schema**: `Payment` model gains `openingDebt Float` and `openingSurplus Float` fields; `HomeownersAssociation` gains `header String?`, `footer String?`, `apartmentsDataDate DateTime?`, `chargesDataDate DateTime?`, `notificationsDataDate DateTime?` (three Prisma migrations required).
- **Import**: `src/lib/parsers/pow-czynsz-parser.ts` (fix header/footer extraction), `src/lib/import/utils.ts` (WMB file grouping per type), `src/lib/parsers/nal-czynsz-parser.ts` (validation), `src/lib/parsers/wplaty-parser.ts` + `src/lib/import/importers/payments.ts` (store openingDebt/openingSurplus)
- **Bulk create**: `src/app/api/admin/unassigned-apartments/route.ts`, `src/app/admin/users/management/`

## Non-goals

- Full financial reporting or PDF export changes (PDF Bilans otwarcia row is in scope as a side effect of the Payment model change).
- Changes to payment import validation (only naliczenia validation is in scope).
- Persisting HOA header/footer to the database is explicitly in scope (saved on notification import).
- Internationalisation or language changes.

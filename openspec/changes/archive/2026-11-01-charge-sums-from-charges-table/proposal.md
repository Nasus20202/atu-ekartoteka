## Why

Monthly charges and closing balances in `wplaty.txt` are wrong for closed years because of an external exporter bug: settlement lines (`Wyrównanie zaliczek ...`, year-end corrections) present in `nal_czynsz.txt` are missing from the monthly charge columns, so every closing balance built on them is off too. Staging data (2025: 384 of 464 payment rows differ in some month; 2024: 20 of 51) shows the `Charge` lines are correct: 328 of 396 apartments' 2026 opening balance equals the 2025 closing balance recalculated from them, against only 72 matching the file's closing balance. The current year is consistent. Every payment table, chart, PDF, dashboard card and admin total reads the wrong values, and the #825 cutoff is derived from them.

## What Changes

- Monthly charges are calculated at read time as the sum of `Charge.totalAmount` per apartment and period (no stored columns, no data migration).
- The unreliable `Payment` fields (monthly charges, closing balance) are renamed in Prisma with `@map` (database columns unchanged) to `legacy*` and documented as incorrect; an ESLint rule confines them to import code so nothing else can read them.
- The closing balance and monthly running balance are derived per year: file opening balance + file payments − calculated charges, counting only months up to the current month. Opening balances stay as imported; there is no chaining across years.
- All reads switch to these figures: tenant and admin payment pages, PDF, dashboard cards and charts, admin HOA financial summary.
- Legacy `<month>Charges` and `closingBalance` stay stored and imported unchanged; they are used only by import validation.
- Tenant cutoff becomes the current month (replaces the #825 rule, which was derived from the invalid columns); the same cap bounds balances so planned future charges do not lower today's balance.
- Import validation stays. The cross-file charge check now reports warnings instead of aborting (**BREAKING** for these two checks); the year-to-year balance check on the stored closing balance also only warns, and a derived balance drift warning is added next to it. Mismatches are rolled up into one warning per apartment and year.
- The admin HOA apartments page shows the HOA header and footer.
- Import page gets an on-demand "validate data in database" action that runs the same checks on stored data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `charges-and-payments`: calculated charges, derived balances, current-month cutoff, admin header/footer, HOA total from derived balances.
- `data-import`: warning severity and rollup for charge and balance mismatches; on-demand database validation.

## Impact

- New `src/lib/queries/payments` helper, a pure balance function, and changes to the payment DTO layer, dashboard data, payment table/PDF/charts, admin payments list, apartment detail and financial-summary route; the removal of `findLatestChargedPayments` and `getChargeCutoffPeriod`.
- `src/lib/import/*` validators and `validate-hoa-files.ts`; new `/api/admin/import/validate` route; import page UI.
- Prisma schema: field renames with `@map` and comments only; the database is unchanged.
- Data prerequisite (outside this change): 1,191 duplicate 2025 charge lines on staging (16 apartments, batch of 2026-07-05) must be removed, otherwise those apartments show doubled charges.

## Non-goals

- Cleaning the duplicate lines and hardening the importer against renumbered line numbers (separate change).
- Repairing or dropping the legacy columns, or changing parsers and file formats.
- Chaining balances across years or editing imported opening balances.
- Explaining the apartments whose next-year opening differs from the derived closing; the drift warning only surfaces them.

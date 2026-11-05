# Importing data

Apartments, owners, charges and payments come from the legacy accounting system
as text files. An administrator uploads them on **Import danych**
(`/admin/import`), and the app turns them into database records.

You can import the same export again. Records are matched, not duplicated, so a
corrected export replaces the earlier one.

## Before you start

- You need an administrator account.
- Export the data from the legacy system, one folder per association.
- Decide whether you are loading an association for the first time, refreshing
  it, or rebuilding its money data from scratch (see
  [Clean import](#clean-import)).

## Step by step

### 1. Lay out the files

Put each association in its own folder. **The folder name is the association's
ID.** Put all the folders in one parent folder:

```
export/
  KLO11/
    lok.txt
    nal_czynsz.txt
    pow_czynsz.txt
    wplaty.txt
    lokal_ost_wys.wmb
    nalicz_ost_wys.wmb
    pow_czynsz_ost_wys.wmb
  KLO12/
    lok.txt
    ...
```

Every file must sit inside an association folder. A file directly in the parent
folder is reported as an error. So is a file with a name the import does not
recognise, and one such file marks the whole run as failed, so keep other files
(notes, backups) out of the folders.

Files are recognised by the start of their name, ignoring case, so a suffix is
fine (`wplaty_2026.txt`, `nal_czynsz_test.txt`):

| Name starts with       | Extension | Contains                                                    |
| ---------------------- | --------- | ----------------------------------------------------------- |
| `lok`                  | `.txt`    | Apartments and their owners                                 |
| `nal_czynsz`           | `.txt`    | Monthly charge lines                                        |
| `pow_czynsz`           | `.txt`    | Current charge notice, plus the association's header/footer |
| `wplaty`               | `.txt`    | Payments and year balances                                  |
| `lok`                  | `.wmb`    | Date the apartment data was exported                        |
| `nal_czynsz`, `nalicz` | `.wmb`    | Date the charge data was exported                           |
| `pow_czynsz`           | `.wmb`    | Date the notice data was exported                           |

You do not need all of them. An association may be imported with only
`wplaty*.txt`, for example. If several files of one kind are present (say
`wplaty1.txt` for 2025 and `wplaty2.txt` for 2026) they are merged. The same
record in two of them is an error, see [What is validated](#what-is-validated).

The text files are ISO-8859-2 encoded. Fields are separated by `#`. Line
endings can be CRLF, LF or CR. Decimals use a comma (`45,89`) and dates in
`.txt` files are `dd/mm/yyyy`.

### 2. Open the import page and pick the folder

1. Go to `/admin/import`.
2. Under **Importuj dane**, choose the parent folder (or a single association
   folder). The page reports how many files it picked up.
3. Leave **Czysty import** and **Pomiń walidację** unticked unless you have a
   reason, see [Options](#options).
4. Click **Importuj**.

The browser gzips the files and sends them in a single request.

### 3. What happens next

For each association, in this order:

1. **Group and parse.** Files are sorted by association and kind. Unknown files
   and duplicate records across files are reported and stop that association.
2. **Validate.** The checks in [What is validated](#what-is-validated) run.
   Blocking errors stop the association before anything is written. Warnings
   are collected and do not stop it.
3. **Write.** Everything for the association is written in one database
   transaction (60 s limit), or nothing is. Associations run two at a time and
   fail independently: one bad association does not affect the others.

Within the transaction the order is: association record (and `.wmb` dates),
optional clean-up, apartments, charges, notices, payments.

### 4. Read the result

Each association gets a card with counts per kind (created, updated, skipped,
total), the `.wmb` dates that were used, its errors and its warnings.

- **Errors** mean the association was not imported (or, for a transaction
  error, not changed). Fix the file and import again.
- **Warnings** mean the data was imported but something does not add up. Read
  them; many are known quirks of the legacy export (below).
- **Pobierz błędy** on a card, or **Pobierz wszystkie błędy** at the top,
  downloads the errors and warnings as a `.txt` file, one line per problem, so
  you can send it to whoever maintains the export.

Re-importing identical files reports 0 created and 0 updated. A value that
differs from the stored one only beyond four decimal places counts as
unchanged.

### 5. Give residents access

Import creates apartments and owner data, not user accounts. Then:

- On the users page, invite owners: this creates an account for each apartment
  email that has no account yet and sends a temporary password. The user must
  change it on first sign-in.
- Or assign apartments to existing accounts. Apartments whose email matches an
  existing user can be assigned in bulk.

An apartment already assigned to a user keeps that user when the import runs
again.

### 6. Re-check later

**Waliduj dane w bazie** runs the same balance checks on the data already in
the database and changes nothing. Use it after manual edits, or to look at
year balances without re-uploading files. **Pomiń pełną walidację** limits it
to the year-balance overview.

## Options

### Clean import

**Czysty import** deletes, for every association in the upload, its charges,
notices and payments before writing the new ones. Apartments and user accounts
are kept. It asks for two confirmations, and it cannot be undone.

Use it when old charge, notice or payment lines must disappear. A normal import
updates and adds records but never deletes charges, notices or payments, so
lines removed from the export stay in the database.

### Skip validation

**Pomiń walidację** skips the charge and payment checks, so even a file with a
broken balance is written. It also needs two confirmations. Duplicate records
across files still stop the import. Reserve it for data you know is wrong in
the source and need loaded anyway.

## What is validated

Blocking errors (the association is not imported):

| Problem                                      | Meaning                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Closing balance does not match a payment row | `closing balance` differs from `opening + payments - charges` by more than 0.01 |
| Duplicate records across files               | The same record appears in two files of one kind                                |
| Unknown file / wrong location                | A file name the import does not know, or a file outside an association folder   |
| Transaction error                            | A database error while writing; nothing was written for that association        |

Warnings (imported anyway):

| Problem                                    | Meaning                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Charge line total                          | `quantity x unit price` differs from the line's total by more than 0.01                                   |
| Charges do not match the payment file      | Per apartment and month, the sum of charge lines differs from `wplaty` by more than 0.05                  |
| Opening balance differs from previous year | The year's opening balance is not the previous year's closing balance (from the file or from the charges) |
| Skipped records                            | Rows for an owner/apartment that is not in `lok.txt` or the database, or not an owner (see below)         |

Two of these are expected on data from the legacy exporter:

- The exporter leaves settlement lines (`Wyrównanie zaliczek ...`) out of the
  monthly figures in `wplaty*.txt`. The app does not show those monthly figures
  or the file's closing balance. It sums the charge lines itself, and computes
  each year's closing balance as opening balance plus payments minus charges,
  up to the current month. The file's values are still imported and checked,
  which is why the warning appears.
- Opening balances from the file are trusted; closing balances are not.

## Behaviour to know about

- **Owners only.** In `lok.txt`, an ID starting with `W` is an owner. Other IDs
  (leases, for example `N00001`) are not apartments. Their charge, notice and
  payment rows are skipped and listed as warnings.
- **Apartments absent from `lok.txt` are deactivated.** If an association's
  `lok.txt` is in the import, apartments in the database that are not in it
  become inactive. They are not deleted. If `lok.txt` is not part of the
  import, apartments are left alone.
- **Owner periods.** An owner whose valid-to date has passed is imported as
  inactive.
- **`.wmb` dates** are stored per kind, only when the matching `.txt` files are
  in the same import, and the newest date wins. A `.wmb` for which there is no
  matching `.txt` (for example `wplaty.wmb`) is accepted and ignored. Only
  admins see these dates.
- **Header and footer.** `pow_czynsz.txt` sets the association's notice header
  and footer, replacing the old ones.
- **Duplicate charge lines in one file** (same apartment, month and line number)
  are kept, with a synthetic line number, so none is lost.
- **Money** is stored with four decimal places, as given in the file, without
  recalculation.
- **What residents see.** Residents see the current year plus the number of
  previous years an admin set on `/admin/settings` (default 2), and only months
  up to the current one. Admins see everything, including future months, so you can
  check an import before the month starts. Older data stays in the database.

## File layouts

Fields are listed in order. Only the ones the import uses are named.

**`lok*.txt`** - one row per owner and apartment, at least 13 fields:

```
W00001#Jan Kowalski##KLO11-KLO11-00000-00001M#ul. Testowa#1#1A#00-001#Warszawa#jan@example.com#20200101#20991231#50.5#1000
```

Owner ID, owner name, (unused), apartment ID, street, building, number, postal
code, city, email, valid from (`yyyymmdd`), valid to (`yyyymmdd`), share
numerator, share denominator. An apartment is identified by owner ID plus
apartment ID. A name containing `#` is handled.

**`nal_czynsz*.txt`** - one row per charge line, 11 fields:

```
W00001#KLO11-KLO11-00000-00001M#01/01/2025#31/01/2025#202501#1#Zarządzanie#1#szt#73#73,00
```

Owner ID, apartment ID, date from, date to, period (`yyyymm`), line number,
description, quantity, unit, unit price, total.

**`pow_czynsz*.txt`** - header, footer, then lines. Two lines containing only
`#` separate the sections: text before the first is the header, text between
them is the footer, and rows after the second are charge lines:

```
Header line
#
Footer line
#
W00001#KLO11-KLO11-00000-00001M#1#Koszta zarządu#1#szt.#245#245,00
```

Line fields: owner ID, apartment ID, line number, description, quantity, unit,
unit price, total.

**`wplaty*.txt`** - one row per apartment and year, 34 fields: owner ID,
apartment ID, year, date from, date to, opening debt, opening surplus, two
fields the import ignores, then a charge and a payment amount for each of the 12
months, then the closing balance. The opening balance is surplus minus debt.

**`*.wmb`** - the first line is a `yyyymmdd` date. A missing or malformed date
is stored as empty and does not fail the import.

## Troubleshooting

| You see                                               | Do this                                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Nieprawidłowa struktura pliku`                       | A file is not inside an association folder. Pick the parent folder, not the files.                                           |
| `Nieznany plik: ...`                                  | Remove the file or rename it to a recognised name.                                                                           |
| `Zduplikowane rekordy w plikach ...`                  | The listed files contain the same record. Remove it from one.                                                                |
| `saldo zamknięcia ... ≠ ...` on a payment row         | The balance in the file does not add up. Fix the export, or skip validation if you must load it.                             |
| `Pominięto ... identyfikator nie oznacza właściciela` | Expected for non-owner IDs. Nothing to fix.                                                                                  |
| `Pominięto ... brak właściciela w lok.txt i w bazie`  | Rows for an owner who is in neither `lok.txt` nor the database. Include their `lok.txt` row, or ignore it for former owners. |
| `Błąd transakcji: ...`                                | A database error. Nothing was written for that association. Check the server log and retry.                                  |
| Old charges are still there after import              | A normal import never deletes them. Use a clean import.                                                                      |

Server-side detail is logged under the `import:handler` and
`api:admin:import` contexts, see [Deployment](deployment.md#logs).

## Where the code is

The pipeline is in `src/lib/import/` (grouping in `utils.ts`, parsing in
`parse-hoa-files.ts` and `src/lib/parsers/`, checks in `validators.ts` and the
other `*-validation.ts` files, writes in `import-hoa-transaction.ts` and
`importers/`). The page is `src/components/import/`, the routes are
`src/app/api/admin/import/` and `.../import/validate/`. The behaviour is
specified in `openspec/specs/data-import/spec.md`.

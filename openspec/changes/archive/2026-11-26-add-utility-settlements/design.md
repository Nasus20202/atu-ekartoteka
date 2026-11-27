# Design

## Context

The text file import (`src/lib/import`, `POST /api/admin/import`) handles apartments, charges, notices and payments. Settlements and meter data exist only in PDF printouts produced by two report templates of the legacy system. Samples for one community cover utility settlements for 2022 and 2024-2026 and annual settlements for 2024 and 2025. They contain real owner names, so they are never committed.

Findings from the samples that constrain the design:

- One utility record can span several non-adjacent pages (owner change: one service per page, with partial summary rows that add up).
- Annual amounts carry rounding adjustments of up to 0.03 zł.
- Annual files may have no document title.
- Utility figures from 2024 on agree exactly with stored charges.

See proposal.md for motivation and the delta specs for behaviour.

## Goals / Non-Goals

**Goals:**

- Write nothing that cannot be matched and read unambiguously.
- Keep printed values; derive groupings when they are used.
- Follow the existing import patterns for upload, findings and tolerances.

**Non-Goals:**

- A general PDF import. Only the two known templates are parsed.
- OCR, or support for mid-period layouts not seen in samples beyond what the parser accepts generically (several lines per utility are accepted).

## Data Model

**Requires explicit approval before any migration is created or applied.** Additive migration `add_utility_settlements`: 6 tables and 1 enum; no existing column changes. `Apartment` gains only the relation fields `utilitySettlements UtilitySettlement[]` and `annualCostSettlements AnnualCostSettlement[]`.

```prisma
enum UtilitySettlementLineKind {
  ADVANCE     // column "Zaliczka"
  CONSUMPTION // column "Do zapłaty": the quantity is the consumption
}

model UtilitySettlement {
  id             String    @id @default(cuid())
  apartment      Apartment @relation(fields: [apartmentId], references: [id])
  apartmentId    String
  periodFrom     DateTime
  periodTo       DateTime
  issuedOn       DateTime
  printedOwner   String    // owner name as printed in the file
  sourceFileName String
  totalAmount    Decimal   @db.Decimal(14, 4) // positive = to pay, negative = overpaid
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  summaries UtilitySettlementSummary[]
  lines     UtilitySettlementLine[]
  readings  MeterReading[]

  @@unique([apartmentId, periodFrom, periodTo])
}

// The summary block, values as printed
model UtilitySettlementSummary {
  id String @id @default(cuid())
  lineNo Int
  settlement      UtilitySettlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  settlementId    String
  code String // row label as printed: "CW", "ZW", "CO"
  consumption     Decimal           @db.Decimal(14, 6)
  advanceQuantity Decimal           @db.Decimal(14, 6)
  difference      Decimal           @db.Decimal(14, 6)
  amount          Decimal           @db.Decimal(14, 4)

  @@unique([settlementId, lineNo])
}

model UtilitySettlementLine {
  id           String                    @id @default(cuid())
  settlement   UtilitySettlement         @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  settlementId String
  lineNo       Int
  kind         UtilitySettlementLineKind
  description  String
  dateFrom     DateTime
  dateTo       DateTime
  quantity     Decimal                   @db.Decimal(14, 6)
  unitPrice    Decimal                   @db.Decimal(14, 4)
  amount       Decimal                   @db.Decimal(14, 4)

  @@unique([settlementId, lineNo])
}

model MeterReading {
  id           String            @id @default(cuid())
  settlement   UtilitySettlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  settlementId String
  lineNo       Int
  device       String // e.g. "CO 01"
  serialNumber String
  label        String // e.g. "CO mieszkania"
  unit         String
  startDate    DateTime
  startValue   Decimal           @db.Decimal(14, 3)
  endDate      DateTime
  endValue     Decimal           @db.Decimal(14, 3)
  consumption  Decimal           @db.Decimal(14, 3)

  @@unique([settlementId, lineNo])
  @@index([serialNumber])
}

model AnnualCostSettlement {
  id             String    @id @default(cuid())
  apartment      Apartment @relation(fields: [apartmentId], references: [id])
  apartmentId    String
  periodFrom DateTime
  periodTo DateTime
  issuedOn       DateTime
  printedOwner   String
  sourceFileName String
  totalAmount    Decimal   @db.Decimal(14, 4) // positive = to pay, negative = overpaid
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  items AnnualCostSettlementItem[]

  @@unique([apartmentId, periodFrom, periodTo])
}

model AnnualCostSettlementItem {
  id               String               @id @default(cuid())
  settlement       AnnualCostSettlement @relation(fields: [settlementId], references: [id], onDelete: Cascade)
  settlementId     String
  lineNo           Int
  title            String
  basisDescription String // "Współczynnik ustalony wg"
  periodFrom       DateTime
  periodTo         DateTime
  communityAmount  Decimal              @db.Decimal(14, 4)
  flatBasis        Decimal              @db.Decimal(14, 4)
  communityBasis   Decimal              @db.Decimal(14, 4)
  coefficient      Decimal              @db.Decimal(7, 4)
  amount           Decimal              @db.Decimal(14, 4) // positive = to pay, negative = overpaid

  @@unique([settlementId, lineNo])
}
```

Amounts are signed: positive is to pay, negative is overpaid. `UtilitySettlement.totalAmount` is the sum of the record's page totals.

## Decisions

### 1. A separate slice `src/lib/settlements`

Folders: `types`, `dto`, `rules` (grouping, matching, tolerances), `parsers` (PDF to records), `validation` (pure checks), `queries`, `mutations`, `use-cases` (preview, import). Reads for the tenant and the import share the types and grouping rules. Alternative: extend `src/lib/import`; rejected, because its context and results are built around HOA folders of text files.

### 2. Position-based PDF reading with `pdfjs-dist`

Text items with coordinates are joined into rows (by vertical position) and cells (by horizontal position). The two generators order text differently inside the file, so reading order cannot be used. `pdfjs-dist` is already a dependency of the visual tests and reads both the encrypted and unencrypted samples. It moves to `dependencies` and is added to `serverExternalPackages`; the standalone build must be verified to include its worker. Alternative: `pdftotext`; rejected, as it adds a system binary to the image.

pdf.js imports its worker by a computed path, so `next.config.ts` lists it in `outputFileTracingIncludes`; without it the standalone build cannot read any file. pdf.js also asks for the optional `@napi-rs/canvas`, which is not part of the standalone build: it logs warnings at first use and text reading works without it.

Parsing is strict: every row inside a record must match a known pattern. Rows above the owner block (community header, title) and after the total (footer notes) are ignored, because that text differs between communities.

### 3. Nothing derived is stored

Kind comes from the column header. The utility code is found at use time by `groupByCode(description, summaryCodes)`: exactly one summary code as a separate word. The same function serves the checks and the views. Unit comes from the meter row of that code, else from brackets in the name. Display names (`CW` to `Ciepła woda` and so on) are constants with the raw code or title as fallback.

### 4. Matching

Candidates are loaded by Prisma query: utility by `externalApartmentId`; annual by `number`, `building` and `address` ending with the printed street (case-insensitive). Names are compared after collapsing spaces and ignoring case. "Annotation only" means the two names differ only in trailing tokens that start with `#` or `@`, are a single letter, a letter-digit code, a number list or `-`; that needs confirmation. Everything else is an error.

### 5. Allocation charges

Annual allocation charges share their description with regular fees, and regular fees can also have unit price 1. Therefore:

- Annual item: a December charge of the apartment with unit price 1 and amount within 0.01 of the item is the allocation line. The flat basis is the sum of the other charges in the period.
- Community: all charges of the basis in the year are compared with community basis plus community amount, which needs no classification.
- Utility: December charges with unit price 1 are excluded from advance and settlement charges.

For a basis starting with `Wyrównanie`, the matching `Zaliczka` description is included.

### 6. Tolerances and severity

Amount tolerance is `NAL_AMOUNT_TOLERANCE` (0.01) and community tolerance `CROSS_CHARGES_TOLERANCE` (0.05), reused from the text import. Quantities and readings compare exactly with `Decimal`. Findings are `{ kind, severity, fileName, page?, apartmentExternalId?, message }`, grouped in the UI with the existing `GroupedIssues` and exported with the existing text download.

### 7. Two stateless requests

Follows `/api/admin/import`: `requireAdmin()` first, JSON body with gzip base64 files (`prepareImportFiles`), `useSWRMutation` with `jsonPoster`. The server keeps nothing between preview and import; the import parses and checks again.

```ts
// POST /api/admin/import/settlements/preview
// request
{ files: PreparedImportFile[] } // { path, name, content }
// response
{
  files: Array<{
    fileName: string;
    documentType: 'utility' | 'annual' | null;
    errors: SettlementIssue[];
    warnings: SettlementIssue[];
    records: Array<{
      key: string; // hash of kind, apartment, period and content
      apartmentExternalId: string | null;
      apartmentLabel: string; // the apartment as the file names it
      printedOwner: string;
      matchedOwner: string | null;
      periodFrom: string; // YYYY-MM-DD
      periodTo: string;
      totalAmount: string; // decimal string
      status: 'new' | 'changed' | 'unchanged' | 'blocked';
      confirmations: Array<'owner-annotation' | 'replace'>;
    }>;
  }>;
}

// POST /api/admin/import/settlements
// request
{ files: PreparedImportFile[]; confirmations: Array<{ key: string; reason: 'owner-annotation' | 'replace' }> }
// response
{
  success: boolean;
  files: Array<{
    fileName: string;
    imported: boolean;
    stats: { created: number; updated: number; unchanged: number };
    errors: SettlementIssue[];
    warnings: SettlementIssue[];
  }>;
}
```

Because the key includes the content, a confirmation cannot apply to a changed file. Each file is written in one transaction; replacing a record deletes its children and writes the new ones. A new record is created, never upserted, so one stored meanwhile makes the file fail. Logs carry counts and account IDs only; file names and findings can contain owner names and are not logged.

### 8. Shared settlement views, tenant page

`/dashboard/settlements?lokal=<apartmentId>&okres=<settlementId>&rok=<settlementId>`, a Server Component behind `Suspense` following `PaymentsOverview`: `getSession()`, approval check, history start year. Every query filters by `apartment: { userId }`; a foreign or hidden identifier ends in `notFound()`. Banner sums and card figures use `groupBy` on lines (by kind) and summary rows (by code). Views are `Tabs` (animated by `TabsContent`); a period change swaps content inside a keyed `ViewTransition`. Amount colouring uses its own helper, because the sign is the opposite of balances.

The views live in `src/components/settlements/` and receive DTOs, so they do not know who is reading. Access is decided by two query entry points: the tenant one takes the user ID and window start year, the admin one only the apartment ID and is called after `requireAdminAccess()`. Both pass their scope to one loader, which applies it to every read, including the selected record. The tenant entry point then sets `origin` (issue date and source file name) to null, and views and PDFs print the document details only when it is there. Alternative: one query with an optional owner filter; rejected, because a forgotten argument would silently widen access.

### 9. Admin apartment page

`ApartmentDetailsSection` loads the settlements for the period in `searchParams` and passes the rendered `Rozliczenia` card to `ApartmentDetailsContent` as a prop, which keeps the card a Server Component inside the client page. No new route or API.

### 10. PDF documents

Follows the existing pattern: `PdfDownloadButton`, a dynamic import of `@react-pdf/renderer` and of the document component, the shared primitives, Geist, and dates in local time. Three documents (utility, meters, annual) in `src/components/pdf/`, built from the same DTOs as the views, A4 portrait, with a header block, a result box (not for meters), `fixed` table headings, unbroken rows and no hyphenation inside table cells. The active view is client state in the shell that holds the header action and the tabs, so the button always matches what is shown. The community header and footer texts are not printed.

react-pdf never breaks before a first child and splits a heading block that straddles the page end, so a section heading is a direct child of the page, unbreakable, with `minPresenceAhead` for the first row.

`fontkit` caches a glyph without its characters when it first reads it for subsetting (as a part of an accented letter), so a later document in the same session loses that letter. `patches/fontkit@2.0.4.patch` rebuilds such a glyph when text needs it, which also fixes the charge, payment and notice PDFs. Alternative: reset the font store before each download; rejected, because `Font.reset()` leaves the fonts unloadable.

### 11. Statistics and metrics

`GET /api/admin/stats` and the `ekartoteka.db.size` gauge each add the counts of `UtilitySettlement`, `MeterReading` and `AnnualCostSettlement`; the response gains `utilitySettlements`, `meterReadings` and `annualSettlements`. Child tables (summaries, lines, items) are not counted. The settlement import refreshes the statistics like the text import, and the Grafana overview row gets one panel per count.

## Risks / Trade-offs

- [Only one community sampled] → strict parsing rejects unknown layouts; add samples and rules as they appear.
- [No sample with a price change or GJ heating] → several lines per utility are accepted and checked by sums; unit conflicts show as findings.
- [Printed owner names change format] → unmatched files are rejected, never guessed.
- [A wrongly imported period cannot be removed in the UI] → overlaps are errors and replacing needs confirmation; removal is manual.
- [Source file names can name other people] → the tenant query drops the issue date and file name, so only admins read them.
- [Charges re-imported later are not re-checked against settlements] → accepted for now.
- [Large uploads exceed the request body limit] → the samples are a few MB in total; the UI shows the server error and files can be sent in smaller sets.
- [Tenant window hides the 2022 settlement with the default of 2 years] → consistent with other history; an admin can widen the window.

## Migration Plan

1. After schema approval, create the migration locally and deploy it with the normal pipeline; it only adds objects.
2. Admins import the files; charges for the same periods should be imported first so records can be verified.
3. Rollback: deploy the previous version; the new tables are unused by it and can be dropped later.

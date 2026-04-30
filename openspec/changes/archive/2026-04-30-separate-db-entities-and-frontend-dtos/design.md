## Context

The current charges and payments flow already respects the repo rule that Prisma
access lives under `src/lib/queries/`, but the boundary after those queries is
blurred. Pages such as `src/app/dashboard/payments/page.tsx`,
`src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`,
`src/app/dashboard/charges/page.tsx`, and
`src/app/dashboard/charges/[apartmentId]/page.tsx` receive database-shaped
records and immediately reshape them with `serializePayment` and
`serializeCharge`.

Those helpers currently do three different jobs at once:

1. Convert `Decimal` fields into strings so React client components and JSON-like
   props can receive them safely.
2. Convert `Date` values into ISO strings for the same reason.
3. Implicitly define frontend contracts via `SerializablePayment`,
   `SerializableCharge`, and `SerializableChargeDisplay` type aliases.

That pattern has two problems:

1. The naming centers on the conversion mechanism (`serialize`) rather than the
   contract (`dto`), so call sites still think in terms of entity shapes.
2. UI and PDF code can easily rehydrate DTOs back into entity-like objects,
   which weakens the separation between persistence models and frontend-facing
   data.

The change is cross-cutting but intentionally narrow: it formalizes the
boundary around the existing charges/payments read paths and PDF/export entry
points, plus the internal API responses that return user and apartment data to
frontend consumers.

## Goals / Non-Goals

**Goals:**

- Introduce explicit DTO types for the existing charges and payments rendering
  paths.
- Make mapper modules the single place where DB/query results are converted into
  frontend-safe values.
- Introduce explicit DTO types for internal user and apartment API payloads.
- Keep current behaviour, formatting, PDF output, and query semantics unchanged.
- Make tests and fixtures describe DTO contracts directly instead of importing
  serializer helpers or `PaymentLike`-style aliases.
- Extend the code-style rule so future server-to-frontend boundaries use the
  same DTO pattern.

**Non-Goals:**

- Changing route payload semantics or adding public API endpoints.
- Refactoring unrelated domains to DTOs in the same change.
- Replacing existing query files with a repository abstraction or service layer.
- Eliminating every `Date` or `Decimal` conversion in the app; only the
  charges/payments and user/apartment API boundaries are in scope.

## Decisions

### Decision 1 — Replace serializer modules with DTO modules in the same domain folders

The current modules:

- `src/lib/payments/serialize-payment.ts`
- `src/lib/charges/serialize-charge.ts`

will be replaced with DTO-oriented modules in the same domain folders so the
import surface stays local to the domain:

- `src/lib/payments/payment-dto.ts`
- `src/lib/charges/charge-dto.ts`

Each module will export:

- one or more DTO type aliases with `Dto` suffixes
- mapper functions named `toPaymentDto`, `toChargeDisplayDto`, and
  `toChargePdfDto` (or equivalent explicit names)
- any domain constants already coupled to the DTO shape, if still needed by
  call sites

**Rationale.** This is the smallest architectural correction. It fixes naming
and intent without inventing a new shared `dto/` tree or moving unrelated code.

**Alternative considered.** Create a repo-wide `src/lib/dto/` package. Rejected
because only charges/payments currently need the pattern, and centralizing now
would add indirection without clear reuse.

### Decision 2 — Keep queries returning DB-shaped records; map in page-level composition code

Query functions under `src/lib/queries/` will keep returning the data they read
from Prisma. DTO mapping will happen in page/server composition code before data
crosses into client components or PDF download props.

Examples:

- `src/app/dashboard/payments/page.tsx` maps query results to a payment-year-row
  DTO before rendering `PaymentYearRow`
- `src/app/dashboard/charges/page.tsx` maps grouped charges to a
  multi-apartment charge DTO structure
- `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` maps the selected
  payment to a PDF/download DTO while continuing to pass the DB-shaped payment
  to server-only consumers such as `PaymentTable` and `PaymentPdfDocument`

**Rationale.** The repo already distinguishes DB access from composition logic.
Keeping mappers in the composition layer makes the boundary explicit and avoids
teaching queries about presentation-specific shapes.

**Alternative considered.** Make queries return DTOs directly. Rejected because
the same query results are sometimes consumed by both server-only rendering code
and client-bound props, so returning DTOs from the query would push presentation
concerns downward.

### Decision 3 — Define DTOs around actual consumers, not one generic “serializable entity” shape

Instead of a single generic serializable alias per entity, DTOs will match
consumer needs:

- `PaymentListItemDto` for `PaymentYearRow`
- `PaymentPdfDto` for `DownloadPaymentPdfButton`
- `ChargeDisplayDto` for `ChargesDisplay`, `MultiChargesDisplay`, and related
  cards
- `ChargePdfItemDto` for `DownloadChargesPdfButton`

Expected shapes:

```ts
type PaymentDtoAmount = string;
type PaymentDtoDate = string;

type PaymentPdfDto = {
  id: string;
  apartmentId: string;
  year: number;
  dateFrom: PaymentDtoDate;
  dateTo: PaymentDtoDate;
  createdAt: PaymentDtoDate;
  updatedAt: PaymentDtoDate;
  openingBalance: PaymentDtoAmount;
  closingBalance: PaymentDtoAmount;
  openingDebt: PaymentDtoAmount;
  openingSurplus: PaymentDtoAmount;
  // all month charge/payment fields as strings
};

type ChargeDisplayDto = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalAmount: string;
  dateFrom: string;
  dateTo: string;
};

type ChargePdfItemDto = Omit<ChargeDisplayDto, 'dateFrom' | 'dateTo'>;
```

Pages may compose these leaf DTOs into page-specific objects as needed.

**Rationale.** Consumer-shaped DTOs prevent accidental dependence on fields that
were only present because the entity had them.

**Alternative considered.** Keep `SerializablePayment` and
`SerializableChargeDisplay`, only renaming functions. Rejected because the
change would remain cosmetic and would not establish a stronger contract.

### Decision 4 — PDF download buttons remain the only client-side rehydration point

`DownloadPaymentPdfButton` currently accepts a stringified payment shape and
hydrates it back into a `Payment`-like object for `PaymentPdfDocument`.
`DownloadChargesPdfButton` similarly adapts charges for PDF generation.

That pattern will remain, but the props will be renamed as DTOs and the
rehydration will be treated as an implementation detail of the download
boundary. The PDF document components themselves will continue to consume the
existing server/domain shapes for now.

**Rationale.** This keeps the refactor small and preserves current PDF behavior.
Changing the PDF document contracts in the same change would widen scope with no
user-visible benefit.

**Alternative considered.** Convert PDF document components to consume DTOs
directly. Rejected for now because those components already work correctly with
`Decimal` helpers and server-like shapes.

### Decision 5 — Update the code-style capability with a frontend DTO boundary rule

The `code-style` spec will gain a requirement stating that when server-side data
is passed into client components, other frontend-only rendering boundaries, or
JSON API responses consumed by the frontend, it must use named DTO types and
dedicated mapping functions rather than ad-hoc serialization helpers.

The rule will not prohibit all data mapping in components. It will specifically
prohibit boundary definitions that are unnamed or serializer-centric.

**Rationale.** The repo already has explicit rules for DB access boundaries. This
change adds the matching rule for DB-to-frontend boundaries.

### Decision 6 — Internal API routes for users and apartments return DTO payloads

Routes that currently return raw query or mutation results for user and
apartment management will map those results to dedicated DTO contracts before
calling `NextResponse.json`.

Initial scope:

- `src/app/api/admin/apartments/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/admin/apartments/[apartmentId]/route.ts`

Expected shapes:

```ts
type ApartmentListItemDto = {
  id: string;
  number: string;
  address: string;
  owner: string;
  isActive: boolean;
};

type UserDto = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  emailVerified: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  apartments?: ApartmentListItemDto[];
};

type ApartmentDetailDto = {
  id: string;
  number: string;
  address: string;
  owner: string;
  isActive: boolean;
  homeownersAssociation: {
    id: string;
    externalId: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  charges: ChargePeriodItemDto[];
  payments: PaymentPdfDto[];
};
```

These DTOs should preserve current field availability for existing admin and
profile screens while removing dependence on raw Prisma result types.

**Rationale.** These routes already form a server-to-frontend boundary, and they
currently return raw selected rows or mutation results. Mapping them explicitly
keeps the boundary consistent with the charges/payments DTO rule.

**Alternative considered.** Leave internal API routes as raw plain objects
because they are already JSON-serializable. Rejected because JSON safety alone
does not provide a stable contract or prevent accidental coupling to DB shapes.

## Risks / Trade-offs

- **Risk: DTO names proliferate and become noisy.** -> Mitigation: only create
  DTOs for actual boundary consumers in the charges/payments path; reuse shared
  leaf DTOs where it keeps names stable.
- **Risk: Mapping stays duplicated across pages.** -> Mitigation: extract shared
  mapper helpers for repeated charge/payment conversions, while keeping page-only
  composition objects local.
- **Risk: Tests become brittle during rename-heavy refactors.** -> Mitigation:
  replace serializer-focused tests first with mapper/DTO tests, then update UI
  fixtures to import DTO types directly.
- **Trade-off: Query return types remain DB-shaped.** -> Accepted because it
  keeps the separation of concerns cleaner than pushing presentation concerns
  into query modules.
- **Risk: internal API DTOs may feel redundant for already JSON-safe payloads.**
  -> Mitigation: limit this to routes that expose domain records used directly by
  the frontend, and keep DTOs close to the owning domain modules.

## Migration Plan

1. Add DTO modules and mapper tests alongside the current serializer modules.
2. Migrate charges call sites to the new DTO types and mappers.
3. Migrate payments call sites to the new DTO types and mappers.
4. Update PDF download button props and their tests to use DTO names.
5. Remove the old serializer modules and serializer-specific tests.
6. Add user/apartment DTO modules and map the targeted internal API routes.
7. Update the relevant OpenSpec delta specs and run lint/tests before review.

Rollback is a normal git revert; there are no schema or data migrations in this
change.

## Open Questions

None.

## 1. DTO Modules and Mapper Tests

- [x] 1.1 Create `src/lib/payments/payment-dto.ts` to replace `serialize-payment.ts`, defining the named payment DTO types needed by the current payment list and PDF download boundaries, and add mapper unit tests in `src/lib/payments/__tests__/payment-dto.test.ts` covering decimal/date string conversion for existing payment fields.
- [x] 1.2 Create `src/lib/charges/charge-dto.ts` to replace `serialize-charge.ts`, defining the named charge display and PDF DTO types used by the current charges views, and add mapper unit tests in `src/lib/charges/__tests__/charge-dto.test.ts` covering display DTO conversion and PDF DTO field narrowing.

## 2. Charges Boundary Migration

- [x] 2.1 Update `src/app/dashboard/charges/page.tsx`, `src/app/dashboard/charges/[apartmentId]/page.tsx`, `src/components/charges/charges-display.tsx`, `src/components/charges/multi-charges-display.tsx`, `src/components/charges/multi-apartment-period-card.tsx`, and any related charge view types to consume the new charge DTOs instead of `SerializableCharge*` aliases; update the affected component tests and fixtures to import DTO types directly.
- [x] 2.2 Update `src/components/pdf/download-charges-pdf-button.tsx` and the charge PDF fixture/test path to accept the named charge PDF DTO contract, keeping the generated PDF behavior unchanged; add or extend tests covering the DTO-based download props.

## 3. Payments Boundary Migration

- [x] 3.1 Update `src/app/dashboard/payments/page.tsx`, `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`, `src/components/payments/payment-year-row.tsx`, and `src/components/payments/admin-payments-list.tsx` to consume the new payment DTO contracts instead of `SerializablePayment` and `PaymentLike`; update the affected tests in `src/components/__tests__/payment-table.test.tsx`, `src/components/payments/__tests__/admin-payments-list.test.tsx`, and any related fixtures.
- [x] 3.2 Update `src/components/pdf/download-payment-pdf-button.tsx` and its test coverage to accept the named payment PDF DTO contract while keeping the current PDF rehydration behavior internal to the download flow.

## 4. Cleanup and Boundary Rule

- [x] 4.1 Remove `src/lib/payments/serialize-payment.ts`, `src/lib/charges/serialize-charge.ts`, and their serializer-specific tests once all imports are migrated, ensuring no remaining charges/payments frontend boundary imports use serializer naming.
- [x] 4.2 Update any touched developer documentation or code comments that reference serializer-based frontend boundaries so they describe DTO mappers instead, and verify the code-style delta is reflected by the final implementation pattern.

## 5. Verification

- [x] 5.1 Run `pnpm lint` and `pnpm test --run`, fixing any regressions in the migrated charges/payments and PDF paths before review.

## 6. User and Apartment API DTO Boundaries

- [ ] 6.1 Create focused `user-dto` and `apartment-dto` mapper modules for the currently exposed internal API payloads, including frontend-safe date fields and nested apartment/user summary data where needed.
- [ ] 6.2 Update `src/app/api/admin/users/route.ts`, `src/app/api/user/profile/route.ts`, `src/app/api/admin/apartments/route.ts`, and `src/app/api/admin/apartments/[apartmentId]/route.ts` to return DTO payloads instead of raw query or mutation results while preserving current response semantics.
- [ ] 6.3 Add or update unit/route tests covering the new DTO mapping for user and apartment API responses, then rerun targeted lint and tests.

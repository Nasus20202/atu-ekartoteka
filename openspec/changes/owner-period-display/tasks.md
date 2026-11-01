# Tasks

## 1. DTO

- [x] 1.1 Add `validTo` to `ApartmentDetailDtoSource` and `ApartmentDetailDto` and map it in `toApartmentDetailDto` in `src/lib/types/dto/apartment-dto.ts`; verify `src/lib/types/__tests__/apartment-dto.test.ts` covers the date and null

## 2. Formatting

- [x] 2.1 Add `formatOwnerPeriod(validFrom, validTo)` in `src/lib/utils/owner-period.ts`; verify `src/lib/utils/__tests__/owner-period.test.ts` covers both dates, start only, end only and neither

## 3. Admin Display

- [x] 3.1 Replace `Właściciel od` with `Okres własności` in `src/app/admin/apartments/[hoaId]/[apartmentId]/apartment-info-card.tsx`; verify the component test in `__tests__/` renders the start-only, both-dates and empty cases

## 4. End-to-End

- [x] 4.1 Update `e2e/admin/import-owner-change.spec.ts` to expect `od 01.02.2020` on the current owner and `od 01.01.2020 do 31.01.2020` on the former owner; verify with `pnpm exec playwright test e2e/admin/import-owner-change.spec.ts`

## 5. Verification

- [x] 5.1 Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test`; verify all pass and no changed file exceeds 200 lines

# Tasks

## 1. Routing

- [x] 1.1 Route TXT files by name prefix in `groupFilesByHOA` (`src/lib/import/utils.ts`), collecting every file of a kind per HOA.
- [x] 1.2 Unit tests in `src/lib/import/__tests__/txt-file-routing.test.ts`.

## 2. Merging

- [x] 2.1 Add `mergeParsedFiles` (`src/lib/import/merge-files.ts`) that concatenates entries and reports records repeated across files; tests in `__tests__/merge-files.test.ts`.
- [x] 2.2 Parse and merge every file kind in `parse-hoa-files.ts`; stop the HOA import on duplicate records in `validate-hoa-files.ts`; tests in `__tests__/import-handler-merge.test.ts`.

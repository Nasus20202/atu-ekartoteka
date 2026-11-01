# Tasks

## 1. Title template

- [x] 1.1 Root layout sets the `%s | ATU Ekartoteka` template and bare default, using `PAGE_TITLE_TEMPLATE` and `APP_NAME` from `src/lib/metadata/document-title.ts`; tests in `document-title.test.ts`.
- [x] 1.2 Static page titles on the layouts and pages listed in the spec.

## 2. Database-backed titles

- [x] 2.1 Admin HOA and apartment layouts resolve titles only for admins; tests in `page-titles.test.ts`.
- [x] 2.2 Tenant charge and payment pages use the owned-apartment label, with generic fallbacks; tests in `page-titles.test.ts`.
- [x] 2.3 Session lookup is cached per request, so the layout and page metadata share one `auth()` call.

## 3. Error and not-found pages

- [x] 3.1 Application and charges error pages set titles through `formatDocumentTitle`.
- [x] 3.2 Not-found pages set their titles through the metadata API.

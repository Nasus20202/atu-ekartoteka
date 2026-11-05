## 1. Theme and components

- [x] 1.1 Add `email-theme.ts` with website-derived tokens and shared styles, plus a test comparing it with the tokens in `globals.css`
- [x] 1.2 Add the shared layout, action button (with fallback link), details box and text components
- [x] 1.3 Add one component per email reproducing the current copy

## 2. Wiring

- [x] 2.1 Render the components in `email-messages.ts` (async builders) and keep plain text on the loader
- [x] 2.2 Await the builders in `email-service.ts`; remove the HTML templates and the HTML branch of the loader
- [x] 2.3 Adapt unit and e2e tests to async builders

## 3. Verification

- [x] 3.1 Compare snapshots with the pre-refactor rendering; regenerate only the account-activation baseline (doctype-driven line height)
- [x] 3.2 Run unit tests, lint, typecheck, production build, integration e2e and the visual email snapshots with no baseline updates

## 4. Specs

- [x] 4.1 Validate and archive the change so `email-notifications` is updated

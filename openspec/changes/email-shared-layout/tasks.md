## 1. Loader building blocks

- [ ] 1.1 Add a CSS inliner that turns single-class rules into inline `style` attributes and throws on unknown classes
- [ ] 1.2 Add partial expansion (`{{> name key="value" }}`) that throws on unknown partials
- [ ] 1.3 Compose body, partials and layout in the template loader; keep `renderEmailTemplate` behaviour unchanged

## 2. Templates

- [ ] 2.1 Create `layout.html`, `layout.css` and `partials/action-button.html`
- [ ] 2.2 Reduce the five HTML templates to their own content using classes and the partial
- [ ] 2.3 Compare rendered output before and after (normalised style declarations) and confirm it is equivalent

## 3. Tests

- [ ] 3.1 Unit tests for the inliner, partial expansion and error cases
- [ ] 3.2 Assert delivered HTML has no `class` attributes or `<style>` block
- [ ] 3.3 Run unit, lint, typecheck and the visual email snapshots with no baseline updates

## 4. Specs

- [ ] 4.1 Validate and archive the change so `email-notifications` is updated

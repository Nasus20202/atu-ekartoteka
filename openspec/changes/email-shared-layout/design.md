## Context

Each `templates/*.html` repeats ~60 lines of shell and inline styles around 20-40 lines of actual content. The loader reads `{name}.{html,txt}` and substitutes `{{VAR}}` placeholders. Email clients are only reliable with inline styles, so the deliverable must stay inline; there is no CSS inlining dependency in the project and none is wanted.

## Goals / Non-Goals

**Goals:**

- One place for layout, one for styles, one for repeated blocks.
- Delivered HTML keeps inline styles only; rendered appearance is unchanged (proven by the existing visual email snapshots).

**Non-Goals:**

- Changing copy, variables, subjects or the plain-text templates.
- A general-purpose template engine or CSS parser (no selectors beyond single classes).

## Decisions

- **Layout file with a content slot.** `layout.html` holds the shell, card, header and footer plus `{{TITLE}}` and `{{CONTENT}}`; each body is inserted at load time. The title is taken from the body's heading so it is written once.
- **`layout.css` inlined at load time.** A small inliner reads `.class { declarations }` rules and replaces each `class="a b"` attribute with the matching `style="..."`. An unknown class throws, so typos fail at startup and in tests. Alternative rejected: a `<style>` block, because several clients strip or ignore it. Alternative rejected: a CSS-inlining package, as an extra dependency for a handful of single-class rules.
- **Partials as files.** `partials/<name>.html` is included with `{{> name key="value" }}`; quoted values fill `{{KEY}}` placeholders inside the partial (values may themselves be `{{VARIABLE}}` placeholders resolved by the normal render pass). First partial: `action-button` (button plus fallback link). Repeating detail rows stay in their bodies as they differ between emails.
- **Split into small modules** (`template-loader`, `template-compose`, `css-inliner`) to respect the 200-line limit.

## Risks / Trade-offs

- Whitespace in the generated markup differs from today's; visual and text-body tests guard the appearance, and a one-off comparison of normalised style declarations before/after guards the content.
- Load-time composition adds start-up work for five templates only; renders still do no I/O.

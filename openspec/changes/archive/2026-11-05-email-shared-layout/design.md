## Context

Each `templates/*.html` repeats ~60 lines of shell and inline styles around 20-40 lines of content; the loader substitutes `{{VAR}}` by regex. Email clients need inline styles, which React Email produces from `style` objects. Message builders (`email-messages.ts`) are the only HTML renderers' callers and are already used from async senders.

## Goals / Non-Goals

**Goals:**

- One layout, one theme, shared building blocks; typed props instead of string placeholders.
- Same rendered appearance, proven by the existing visual email snapshots without baseline updates.

**Non-Goals:**

- Changing copy, subjects, recipients or plain-text bodies.
- Previewing server (`react-email dev`) or a build step for emails.

## Decisions

- **React Email (`@react-email/components`).** It handles client quirks (doctype, conditional comments, table layout) and ships `render`. A single package is enough; its bundled `render` is used. Alternative considered: bare `react-dom/server` with own components, rejected in favour of the library the owner prefers.
- **Theme module mirrors the site tokens.** `email-theme.ts` holds hex values equal to the HSL tokens in `globals.css` plus spacing, radius and font stacks, and exports shared style objects. A test parses the CSS tokens and compares them, so drift fails. Hex is kept for client compatibility.
- **Components** in `src/lib/email/components/` (layout, action button with fallback link, details box, paragraph/note) and one component per email in `src/lib/email/emails/`; builders in `email-messages.ts` render them.
- **Plain text unchanged.** `.txt` templates and their exact snapshots stay; the loader no longer loads HTML.
- **Async builders.** `render` returns a promise, so builders and the service call sites await it.

## Risks / Trade-offs

- New runtime dependency (accepted by the owner).
- `react-dom/server` runs inside Next server code; verified by a production build and the integration e2e that delivers real emails.
- React Email emits the XHTML Transitional doctype, which puts browsers in almost-standards mode; mixed-font lines (monospace values) measure about 2px taller per row in the browser-based snapshots, so the account-activation baseline was regenerated. Other emails stay within the snapshot tolerance. Delivered-email assertions look at `href` links only, since the doctype itself contains a URL.

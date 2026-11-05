## Context

After the move to React Email, only the plain-text part still came from `{{VARIABLE}}` templates. React Email already ships an HTML-to-text conversion.

## Goals / Non-Goals

**Goals:** one source per email; text that reads well on its own.

**Non-Goals:** changing the HTML, subjects or recipients.

## Decisions

- **Convert the rendered HTML** with `toPlainText`, so the text always matches the HTML content.
- **Tune with markers, not special text:** elements carry `data-skip-in-text` (brand header, fallback paragraph) or `data-detail-label` (label on its own line), and headings are not upper-cased. No separate text copy exists.
- **Keep exact snapshots** of all five bodies so any change in the generated text is reviewed.

## Risks / Trade-offs

- Text wording follows the HTML (for example "Zaloguj się <url>" instead of "Zaloguj się tutaj:"); reviewed through the snapshots.
- A change to the converter's defaults after a dependency bump shows up as a snapshot diff.

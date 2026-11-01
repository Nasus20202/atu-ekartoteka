# Design

## Context

`ConfirmCreateDialog` shows the accounts to create and calls `onConfirm` from its single button. The page sets the preview list to open the dialog and clears it on confirm or cancel. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- Make the second confirmation impossible to skip, without changing the page's data flow.

**Non-Goals:**

- Typing a confirmation word or the account count. A plain second step is enough for this admin tool.

## Decisions

**Two steps inside the existing dialog.** The dialog renders one content component that switches between the `review` and `final` step with local state. Alternative: a second dialog opened by the first. Rejected: two stacked dialogs need extra open/close state in the page for no gain.

**Step resets on every open.** Radix unmounts `DialogContent` when the dialog closes, so the step state held inside it starts at `review` each time. Alternative: store the step in the page and reset it in an effect. Rejected: more state for the same result.

**Parent contract unchanged.** `onConfirm` is still the only way to start the request, and it is called only from the final step. The page does not need to know about the steps.

**Button label only on the submit button.** The tab trigger `Utwórz konta` is left as is (see proposal non-goals).

## Risks / Trade-offs

- [An admin reads "Dalej" as "Zapisz"] → The second step names the action on its button, and its text says the invitations are sent at once.
- [Tests and e2e select the buttons by name] → The final button is queried inside the dialog (`role="dialog"`), because the page's submit button has the same name.

## Migration Plan

No data migration. The change is deployed with the frontend.

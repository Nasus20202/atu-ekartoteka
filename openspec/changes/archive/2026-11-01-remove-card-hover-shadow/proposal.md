# Proposal

## Why

The admin apartment cards and the HOA cards on the apartments page gained a shadow on hover. Cards are containers, and the shadow suggested that the whole card is clickable, while only the address or HOA name link inside it is. The shadow was removed from both cards in the working tree; this change records that.

## What Changes

- Remove the `hover:shadow-lg` class from the apartment card (`src/app/admin/apartments/[hoaId]/apartment-card.tsx`) and the HOA card (`src/app/admin/apartments/hoa-list-card.tsx`).
- The duplicate-address and inactive markers on the apartment card are unchanged.

Non-goals:

- Changing the hover state of the links inside the cards.
- Changing the card layout or the transition timing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a visual adjustment. The interactive elements keep their hover states: the links inside the cards still respond on hover, as the visual-design interactive states rule requires.

## Impact

- `src/app/admin/apartments/[hoaId]/apartment-card.tsx`.
- `src/app/admin/apartments/hoa-list-card.tsx`.

Open question for the user: should the cards keep some hover feedback, for example a border change, or is the plain card the intended design?

# Proposal

## Why

The plain-text part of each email is only guarded by fragment checks, and no screenshot covers it, so most of its wording can change unnoticed.

## What Changes

- Add exact-body unit snapshots of the plain-text part of all five emails, rendered with fixed inputs.

**Non-goals**

- No change to email content, to the HTML screenshots or their tolerance, and no new integration assertions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `testing`: the email template tests pin the full plain-text bodies.

## Impact

- `src/lib/email/__tests__/email-text-bodies.test.ts` only.

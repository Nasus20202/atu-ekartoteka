# Proposal

## Why

Charge and notice quantities were printed with a dot (`50.5 m2`) next to amounts and shares that use the Polish decimal comma (`2,50 zł`, `5,05%`), so one line mixed two number formats.

## What Changes

- Quantities in the dashboard notifications card, the admin notifications card, charge lists and PDF item tables use a decimal comma (`50,5 m2`), keeping the stored precision.

## Capabilities

### Modified Capabilities

- `charges-and-payments`: quantity formatting.

## Non-goals

- Rounding quantities or changing how they are stored or imported.

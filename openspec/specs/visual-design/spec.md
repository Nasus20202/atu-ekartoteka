# Capability: Visual Design

## Purpose

Defines the visual design language and UI component conventions for the ATU Ekartoteka application. All UI work SHALL follow these rules to maintain a consistent, accessible, and professional appearance.

---

## Requirements

### Requirement: Design system

The application SHALL use shadcn/ui as its component library, built on top of Tailwind CSS v4 and Radix UI primitives.

#### Scenario: Adding a new UI element

- **GIVEN** a developer needs a button, input, dialog, table, badge, or other common control
- **WHEN** they implement it
- **THEN** they use the corresponding shadcn/ui component (e.g., `Button`, `Input`, `Dialog`, `Table`, `Badge`) rather than authoring a custom element from scratch

#### Scenario: Customising a component

- **GIVEN** a shadcn/ui component that does not fully match the design requirement
- **WHEN** a developer customises it
- **THEN** they extend it via Tailwind utility classes passed as `className` props; they do not modify the component source in `src/components/ui/` unless the change is truly global

---

### Requirement: Colour palette

The application SHALL use the CSS custom-property token system provided by shadcn/ui (neutral base, with semantic tokens for background, foreground, primary, secondary, destructive, muted, accent, card, border, input, ring).

#### Scenario: Applying a colour

- **GIVEN** a developer needs to colour text, a background, or a border
- **WHEN** they write Tailwind classes
- **THEN** they use semantic tokens (e.g., `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) rather than raw palette values (e.g., `bg-gray-100`, `text-zinc-700`)

#### Scenario: Destructive actions

- **GIVEN** a button or alert that represents a destructive action (delete, reject, deactivate)
- **WHEN** it is rendered
- **THEN** it uses the `destructive` variant (`variant="destructive"` on `Button`, `bg-destructive` / `text-destructive` for custom elements)

#### Scenario: Status indicators

- **GIVEN** a user account status (PENDING, APPROVED, REJECTED)
- **WHEN** displayed in a table or detail view
- **THEN** it is shown as a `Badge` with a semantically appropriate variant:
  - `APPROVED` → `default` (primary colour)
  - `PENDING` → `secondary` (muted)
  - `REJECTED` → `destructive` (red)

---

### Requirement: Typography

The application SHALL use a consistent type scale defined by Tailwind's default scale.

#### Scenario: Page title

- **GIVEN** the top-level heading of an admin or dashboard page
- **WHEN** rendered
- **THEN** it uses `text-2xl font-bold` or the `PageHeader` component which enforces this style

#### Scenario: Section heading

- **GIVEN** a secondary heading within a page (e.g., a card title, group label)
- **WHEN** rendered
- **THEN** it uses `text-lg font-semibold` or `text-base font-medium` depending on hierarchy

#### Scenario: Body and labels

- **GIVEN** descriptive text, table cell content, or form labels
- **WHEN** rendered
- **THEN** they use the default `text-sm` size with `text-foreground` or `text-muted-foreground` for supporting copy

---

### Requirement: Spacing and layout

Pages SHALL use consistent spacing via Tailwind's spacing scale.

#### Scenario: Page wrapper

- **GIVEN** any admin or dashboard page
- **WHEN** it is rendered
- **THEN** it is wrapped in the `Page` component which applies consistent horizontal padding and a maximum width constraint

#### Scenario: Section spacing

- **GIVEN** vertically stacked sections within a page (header, filter bar, table, pagination)
- **WHEN** laid out
- **THEN** sections are separated by `mb-4`, `mb-6`, or `gap-4` / `gap-6` consistently; individual items within a section use `gap-2` or `gap-3`

#### Scenario: Form layout

- **GIVEN** a form with multiple fields
- **WHEN** laid out
- **THEN** fields stack vertically with `space-y-4`; related fields in the same row use `grid grid-cols-2 gap-4`

---

### Requirement: Interactive states

All interactive elements SHALL have visible focus, hover, and disabled states.

#### Scenario: Focus ring

- **GIVEN** any focusable control (button, input, link, checkbox, select)
- **WHEN** focused via keyboard
- **THEN** a visible ring is shown; shadcn/ui components provide this via `ring-ring` tokens automatically — do not suppress it with `outline-none` unless replacing it with an equivalent visible indicator

#### Scenario: Disabled state

- **GIVEN** a button or input that is temporarily unavailable (e.g., form submitting, no selection made)
- **WHEN** rendered in the disabled state
- **THEN** the `disabled` prop is set (not just a visual opacity class); the element is not keyboard-focusable and is announced as disabled to screen readers

---

### Requirement: Feedback and alerts

User feedback SHALL use the `Alert` component or inline state — not toast libraries.

#### Scenario: Success feedback

- **GIVEN** an action that completes successfully (e.g., user created, settings saved)
- **WHEN** the response is received
- **THEN** an `Alert` with `variant="default"` (or a success-coloured inline message) is rendered within the page; no external toast library is used

#### Scenario: Error feedback

- **GIVEN** an action that fails (API error, validation error)
- **WHEN** the error is received
- **THEN** an `Alert` with `variant="destructive"` is rendered near the relevant form or action; the error message is in Polish and is specific (not generic "Something went wrong")

#### Scenario: Empty state

- **GIVEN** a list or table with no data to display
- **WHEN** rendered
- **THEN** a clear Polish-language empty-state message is shown (e.g., "Brak mieszkań bez kont"); the table or list container is not left blank

---

### Requirement: Responsive layout

The application SHALL be usable on desktop viewports (≥ 1024 px). Mobile optimisation is a non-goal for the current version but layouts SHALL NOT break catastrophically on smaller screens.

#### Scenario: Admin table on desktop

- **GIVEN** an admin data table with 5–8 columns
- **WHEN** rendered on a ≥ 1280 px viewport
- **THEN** all columns are visible without horizontal scrolling

#### Scenario: Narrow viewport

- **GIVEN** a viewport narrower than 768 px
- **WHEN** a page is rendered
- **THEN** the layout does not overflow its container; horizontal scroll on the page body is not present (individual wide tables may scroll within their container)

---

### Requirement: Accessibility baseline

The application SHALL meet a basic accessibility baseline.

#### Scenario: Images and icons

- **GIVEN** a decorative icon (Lucide React icon used for visual reinforcement only)
- **WHEN** rendered alongside a text label
- **THEN** the icon has `aria-hidden="true"` or is rendered without an accessible name; the text label carries the semantic meaning

#### Scenario: Icon-only buttons

- **GIVEN** a button that contains only an icon (no visible text label)
- **WHEN** rendered
- **THEN** it has an `aria-label` attribute describing its action in Polish (e.g., `aria-label="Usuń użytkownika"`)

#### Scenario: Form inputs

- **GIVEN** any form input, select, or checkbox
- **WHEN** rendered
- **THEN** it has an associated `<label>` element (via `htmlFor` / `id` linkage or wrapping) so screen readers announce the field name

#### Scenario: Loading states

- **GIVEN** a page or section that is fetching data
- **WHEN** the fetch is in progress
- **THEN** a visible loading indicator is shown (spinner or skeleton) and interactive controls that depend on the data are disabled or absent

## MODIFIED Requirements

### Requirement: Responsive layout

The application SHALL be fully usable on mobile viewports (≥ 375 px) as well as desktop (≥ 1024 px). No element SHALL overflow its container or cause the page body to scroll horizontally. Layouts SHALL adapt at Tailwind's `sm` (640 px) and `md` (768 px) breakpoints.

#### Scenario: Page body horizontal scroll

- **WHEN** any page is viewed at any viewport width ≥ 375 px
- **THEN** the page body does not scroll horizontally; all content is contained within the viewport

#### Scenario: Page wrapper padding on mobile

- **WHEN** any admin or dashboard page is rendered on a viewport narrower than 768 px
- **THEN** the `<Page>` wrapper applies `p-4` padding

#### Scenario: Page wrapper padding on desktop

- **WHEN** any admin or dashboard page is rendered on a viewport ≥ 768 px
- **THEN** the `<Page>` wrapper applies `p-8` padding

#### Scenario: Wide data table on mobile

- **WHEN** a data table with 4 or more columns is rendered on a viewport narrower than 640 px
- **THEN** the table scrolls horizontally within its container; the page body does not scroll horizontally

#### Scenario: Summary stat grid on mobile

- **WHEN** a grid of summary stat cards containing `text-2xl` numeric values is rendered on a viewport narrower than 640 px
- **THEN** the grid displays 1 column so each stat has sufficient width

#### Scenario: Summary stat grid on desktop

- **WHEN** a grid of summary stat cards is rendered on a viewport ≥ 640 px
- **THEN** the grid displays 2 columns

#### Scenario: Info detail grid on mobile

- **WHEN** a 2-column label/value info grid is rendered on a viewport narrower than 640 px
- **THEN** the grid collapses to 1 column

#### Scenario: Charge row on mobile

- **WHEN** a charge item row is rendered on a viewport narrower than 640 px
- **THEN** the price details (quantity × unit price, total amount) appear below the charge description; the row does not overflow

#### Scenario: Charge row on desktop

- **WHEN** a charge item row is rendered on a viewport ≥ 640 px
- **THEN** the description and price details appear on a single horizontal line

#### Scenario: Page header action bar — contextual actions

- **WHEN** a page header contains 2 or more contextual action buttons (create, navigate, etc.)
- **THEN** those actions are presented in a `DropdownMenu` triggered by a single button, keeping the header clean at all viewport widths

#### Scenario: Filter/tab button row on mobile

- **WHEN** a row of filter or toggle buttons is rendered on a viewport narrower than 640 px
- **THEN** the buttons wrap to additional lines rather than overflowing; the active selection remains visible

#### Scenario: Per-item action buttons

- **WHEN** a list card or table row contains 2 or more contextual action buttons
- **THEN** those actions are presented in a `DropdownMenu` so the card layout remains stable on all viewport widths

#### Scenario: Modal on mobile

- **WHEN** an admin modal dialog is rendered on a viewport narrower than 640 px
- **THEN** the modal card has at least 16 px clearance from each screen edge

#### Scenario: Navigable list row tap target

- **WHEN** a list row whose primary purpose is navigation is rendered on any viewport
- **THEN** the entire row area is a tappable/clickable target

#### Scenario: Flex row elements with fixed content widths

- **WHEN** a flex row contains elements with constrained or fixed widths (e.g., currency amounts, icon buttons)
- **THEN** those elements have `shrink-0` so they are never compressed; variable-length text elements have `min-w-0` so they absorb available space without overflowing

## MODIFIED Requirements

### Requirement: Typography

The application SHALL use a consistent, responsive type scale defined by Tailwind's default scale.

#### Scenario: Page title on desktop

- **WHEN** the top-level heading of an admin or dashboard page is rendered on a viewport ≥ 640 px
- **THEN** it uses `text-3xl font-bold`

#### Scenario: Page title on mobile

- **WHEN** the top-level heading of an admin or dashboard page is rendered on a viewport narrower than 640 px
- **THEN** it uses `text-2xl font-bold` so long Polish page titles do not cause overflow

#### Scenario: Section heading

- **GIVEN** a secondary heading within a page (e.g., a card title, group label)
- **WHEN** rendered
- **THEN** it uses `text-lg font-semibold` or `text-base font-medium` depending on hierarchy

#### Scenario: Body and labels

- **GIVEN** descriptive text, table cell content, or form labels
- **WHEN** rendered
- **THEN** they use the default `text-sm` size with `text-foreground` or `text-muted-foreground` for supporting copy

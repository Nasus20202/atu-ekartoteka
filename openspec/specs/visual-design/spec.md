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

---

### Requirement: Financial Charts Follow Application Visual Language

The system SHALL render financial charts using the same semantic colour, spacing, and card layout conventions as the rest of the application.

#### Scenario: Chart lives inside existing card layout

- **GIVEN** any financial chart added to the tenant or admin UI
- **WHEN** it is rendered
- **THEN** it appears inside an existing or matching `Card` layout with a Polish title or description rather than as a free-floating canvas

#### Scenario: Semantic series styling used

- **GIVEN** a chart series representing payments, charges, or balances
- **WHEN** it is rendered
- **THEN** its styling uses semantic, app-consistent colour choices that distinguish the series without relying on arbitrary raw palette values

#### Scenario: Area charts use restrained fill treatment

- **GIVEN** a financial chart rendered as an area chart
- **WHEN** it is shown in the tenant or admin UI
- **THEN** the filled area uses a restrained opacity or gradient treatment that keeps the chart readable inside the existing card layout
- **AND** the line or edge of the series remains visually distinguishable from the fill

---

### Requirement: Financial Charts Remain Usable on Mobile and Assistive Technologies

The system SHALL ensure financial charts are responsive, keyboard-safe, and supplemented by readable text context.

#### Scenario: Chart does not cause horizontal page overflow

- **GIVEN** a chart rendered on a viewport width of 375 px or wider
- **WHEN** the page loads
- **THEN** the chart fits within its container and does not cause the page body to scroll horizontally

#### Scenario: Chart has text context

- **GIVEN** a chart rendered on any finance page
- **WHEN** a user reads the surrounding content or uses assistive technology
- **THEN** the page includes a visible label, description, or equivalent text context explaining what the chart represents

#### Scenario: Tooltip values use existing currency formatting

- **GIVEN** a user hovers or focuses a financial chart data point
- **WHEN** the value tooltip is shown
- **THEN** monetary values are formatted consistently with the application's existing PLN currency formatting

#### Scenario: Tooltip text readable in dark mode

- **GIVEN** the application is in dark mode
- **WHEN** a financial chart tooltip is shown, including for the balance bar chart
- **THEN** the tooltip title and every value use the theme foreground colour, never fixed black
- **AND** the same holds in light mode

### Requirement: Financial Charts Show Zero Baseline and Units

The system SHALL render monetary financial charts with a visible zero baseline and readable amount labels.

#### Scenario: Zero reference line shown

- **GIVEN** a payment-year chart or a dashboard financial chart
- **WHEN** it is rendered
- **THEN** a horizontal reference line is drawn at 0
- **AND** the Y-axis domain always includes 0, including when every value is negative

#### Scenario: Zero tick emphasised

- **GIVEN** a financial chart whose Y axis shows a 0 tick
- **WHEN** it is rendered
- **THEN** the 0 tick label is bold while the other tick labels keep the regular weight

#### Scenario: Dashboard amounts show currency

- **GIVEN** a dashboard financial chart
- **WHEN** its Y axis is rendered
- **THEN** tick labels are compact amounts with the `zł` unit, for example `1,2 tys. zł`

### Requirement: Infinite Scroll — Automatic Loading on Scroll

Admin lists backed by a paginated API SHALL show the first page on load and SHALL append the next page automatically when the end of the list scrolls into view, until every item is loaded. The application SHALL NOT render numbered page controls or previous/next page buttons for these lists.

#### Scenario: Next page appended when reaching the end

- **GIVEN** an admin list whose total exceeds one page
- **WHEN** the admin scrolls so that the end of the list becomes visible
- **THEN** the next page is requested and its items are appended below the already-loaded items
- **AND** the already-loaded items stay in place

#### Scenario: No page controls rendered

- **GIVEN** any admin list covered by this capability
- **WHEN** the list is rendered
- **THEN** no `Poprzednia`, `Następna`, page number or `Strona X z Y` controls are shown

#### Scenario: All items loaded

- **GIVEN** every item of the list has been loaded
- **WHEN** the admin reaches the end of the list
- **THEN** no further request is made and no loading indicator is shown

### Requirement: Infinite Scroll — Loading Feedback While Fetching More

While the next page is being fetched, the list SHALL show a loading indicator below the loaded items and SHALL NOT request the same page twice.

#### Scenario: Loading indicator shown

- **GIVEN** the next page request is in flight
- **WHEN** the admin looks at the end of the list
- **THEN** a spinner with the text `Ładowanie...` is shown below the loaded items

#### Scenario: Concurrent triggers do not duplicate requests

- **GIVEN** the next page request is in flight
- **WHEN** the end of the list leaves and re-enters the viewport
- **THEN** no additional request for that page is made and no item appears twice

### Requirement: Infinite Scroll — Accessible Manual Fallback

Lists SHALL offer a focusable `Pokaż więcej` button at the end of the loaded items while more items remain, so keyboard and assistive-technology users, and browsers without scroll-visibility support, can load the next page.

#### Scenario: Keyboard user loads more

- **GIVEN** more items remain to be loaded
- **WHEN** the admin focuses the `Pokaż więcej` button and activates it with the keyboard
- **THEN** the next page is appended exactly as with automatic loading

#### Scenario: Fallback hidden when list is complete

- **GIVEN** every item has been loaded
- **WHEN** the list is rendered
- **THEN** the `Pokaż więcej` button is not shown

### Requirement: Infinite Scroll — Reset on Query Change

When the admin changes the search text or a filter of a list, the list SHALL discard the loaded items and load the first page for the new query. Responses for an outdated query SHALL be ignored.

#### Scenario: Filter change restarts the list

- **GIVEN** an admin has loaded three pages of a list
- **WHEN** they change a filter or the search text
- **THEN** the list shows only the first page of results for the new query

#### Scenario: Stale response ignored

- **GIVEN** a next-page request for the previous query is still in flight
- **WHEN** the admin changes the query and the old response arrives afterwards
- **THEN** the old items are not added to the new list

### Requirement: Infinite Scroll — Load Failure Handling

If loading the next page fails, the list SHALL keep the already-loaded items, SHALL show an inline error message, and SHALL let the admin retry with the `Pokaż więcej` button.

#### Scenario: Next page request fails

- **GIVEN** an admin has one page loaded
- **WHEN** the next page request fails
- **THEN** the loaded items remain visible
- **AND** the message `Nie udało się wczytać kolejnych pozycji` is shown with a `Pokaż więcej` button that retries the same page

### Requirement: List View — View Switch on Admin Lists

The HOA apartments list and the admin users list SHALL show a view switch with two options, `Kafelki` (cards) and `Tabela`. Selecting an option SHALL re-render the already-loaded items in that view without a new request and without changing search, filters or loaded pages.

#### Scenario: Switching to the table view

- **GIVEN** an admin on the HOA apartments list in cards view with 40 apartments loaded
- **WHEN** they select `Tabela`
- **THEN** the same 40 apartments are shown in a table
- **AND** no new list request is made and the search and `Tylko aktywne` state are unchanged

#### Scenario: Switching back to cards

- **GIVEN** an admin on the users list in table view
- **WHEN** they select `Kafelki`
- **THEN** the loaded users are shown as cards again with the active filter kept

#### Scenario: Infinite scrolling works in both views

- **GIVEN** the table view is selected and more items remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows in the selected sort order

### Requirement: List View — Default and Remembered View

Cards SHALL be the default view. The chosen view SHALL be remembered separately for the apartments list and the users list in the admin's browser, and SHALL be restored when that list is opened again. If the browser cannot store it, the switch SHALL still work for the current visit.

#### Scenario: First visit shows cards

- **GIVEN** an admin who has never used the switch in this browser
- **WHEN** they open the apartments list
- **THEN** the cards view is shown

#### Scenario: Choice restored on return

- **GIVEN** an admin selected `Tabela` on the apartments list
- **WHEN** they reload the page or open another HOA's apartments
- **THEN** the table view is shown

#### Scenario: Lists remember independently

- **GIVEN** an admin selected `Tabela` on the apartments list
- **WHEN** they open the users list for the first time
- **THEN** the users list shows cards

#### Scenario: Storage unavailable

- **GIVEN** the browser blocks site storage
- **WHEN** the admin selects `Tabela`
- **THEN** the table view is shown for the current page without an error

### Requirement: List View — Animated View Change

Changing the selected view SHALL animate the new content in, and the animation SHALL be skipped when the admin prefers reduced motion.

#### Scenario: Switching animates the items

- **GIVEN** an admin on the apartments list in cards view
- **WHEN** they select `Tabela`
- **THEN** the table fades and rises into place instead of appearing abruptly

#### Scenario: Reduced motion

- **GIVEN** an admin whose system prefers reduced motion
- **WHEN** they switch views
- **THEN** the new view appears immediately without animation

### Requirement: List View — Accessible View Switch

The view switch SHALL be a group of buttons labelled `Kafelki` and `Tabela`, each with an icon, operable by keyboard, with the active option exposed as pressed to assistive technologies. The switch SHALL be rendered by a reusable segmented control that accepts any number of options.

#### Scenario: Active option announced

- **GIVEN** the table view is active
- **WHEN** a screen reader reaches the switch
- **THEN** `Tabela` is reported as pressed and `Kafelki` as not pressed

#### Scenario: Keyboard switching

- **GIVEN** focus is on the `Kafelki` button
- **WHEN** the admin presses Tab to `Tabela` and activates it with Enter or Space
- **THEN** the table view is shown

### Requirement: Table — Sortable Columns

Every table view SHALL sort from a column header click, expose the active sort direction through `aria-sort`, and toggle between ascending and descending when the active header is clicked again. The sort indicator SHALL be visible on the active column. Sorting SHALL be applied by the list request (sort column and direction sent to the API), so the loaded pages are replaced by the first page in the new order and infinite scrolling keeps appending rows in that same order.

#### Scenario: First click sorts ascending

- **GIVEN** the apartments table in the API order
- **WHEN** the admin activates the `Adres` header
- **THEN** the first page is requested with `sort=label&order=asc` and the rows are shown ascending by address with `aria-sort` `ascending`

#### Scenario: Second click reverses the order

- **GIVEN** the rows sorted ascending by address
- **WHEN** the admin activates the `Adres` header again
- **THEN** the first page is requested with `order=desc` and the rows are shown descending with `aria-sort` `descending`

#### Scenario: Switching the sorted column

- **GIVEN** the rows sorted by address
- **WHEN** the admin activates the `Udział` header
- **THEN** the rows are sorted by share ascending and only the `Udział` header reports an active sort

#### Scenario: Sorting replaces the loaded pages

- **GIVEN** a table with several pages loaded
- **WHEN** the admin sorts a column
- **THEN** the current rows stay visible until the first page in the new order arrives, then they are replaced without gaps or duplicates

#### Scenario: Sorting does not replay the view animation

- **GIVEN** the table view is already shown
- **WHEN** the admin sorts a column
- **THEN** the list content updates in place without replaying the view-change animation

#### Scenario: Appended pages keep the order

- **GIVEN** the table sorted descending by address and more rows remain
- **WHEN** scrolling appends the next page
- **THEN** the new rows continue the descending order without gaps or duplicates
